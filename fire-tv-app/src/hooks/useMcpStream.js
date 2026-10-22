/**
 * ============================================================================
 * THE GHOST-DIRECTOR: REAL-TIME MCP STREAMING HOOK
 * ============================================================================
 * Connects Fire TV client to Alexa+ MCP server via:
 * 1. Native WebSocket (fastest bi-directional streaming)
 * 2. Server-Sent Events (SSE fallback)
 * 3. HTTP Polling fallback (ensures 100% resilience under all network environments)
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '';

export function useMcpStream() {
  const [state, setState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTED' | 'RECONNECTING' | 'OFFLINE'
  const [transportType, setTransportType] = useState('INITIALIZING'); // 'WEBSOCKET' | 'SSE' | 'POLLING'
  const [lastNotification, setLastNotification] = useState(null);
  const [voiceAssistantState, setVoiceAssistantState] = useState({
    active: false,
    query: '',
    response: '',
    loading: false,
  });

  const wsRef = useRef(null);
  const sseRef = useRef(null);

  // 1. Initial State Fetch
  const fetchStateSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setConnectionStatus('CONNECTED');
        return data;
      }
    } catch (e) {
      console.warn('[useMcpStream] State snapshot fetch failed:', e.message);
    }
    return null;
  }, []);

  // 2. Establish Stream Connection
  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    fetchStateSnapshot();

    // Attempt WebSocket first
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus('CONNECTED');
        setTransportType('WEBSOCKET');
        console.log('[useMcpStream] Connected via WebSocket');
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.fullState) {
            setState(payload.fullState);
          }
          if (payload.type && payload.type !== 'INITIAL_STATE') {
            setLastNotification({
              type: payload.type,
              payload: payload.payload,
              timestamp: Date.now(),
            });
          }
        } catch (err) {
          console.error('[useMcpStream] WS parse error:', err);
        }
      };

      ws.onerror = () => {
        // Fallback to SSE
        if (wsRef.current) wsRef.current.close();
        initSseFallback();
      };

      ws.onclose = () => {
        if (isMounted && transportType === 'WEBSOCKET') {
          setConnectionStatus('RECONNECTING');
          initSseFallback();
        }
      };
    } catch {
      initSseFallback();
    }

    function initSseFallback() {
      if (sseRef.current || !isMounted) return;

      try {
        console.log('[useMcpStream] Falling back to SSE transport...');
        const sse = new EventSource(`${API_BASE}/api/events`);
        sseRef.current = sse;

        sse.onopen = () => {
          if (!isMounted) return;
          setConnectionStatus('CONNECTED');
          setTransportType('SSE');
        };

        sse.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(e.data);
            if (data.fullState) {
              setState(data.fullState);
            } else if (data.ring && data.bee) {
              setState(data);
            }
          } catch (err) {
            console.error('[useMcpStream] SSE parse error:', err);
          }
        };

        sse.onerror = () => {
          // Fallback to Polling
          if (sseRef.current) {
            sseRef.current.close();
            sseRef.current = null;
          }
          initPollingFallback();
        };
      } catch {
        initPollingFallback();
      }
    }

    function initPollingFallback() {
      if (pollInterval || !isMounted) return;
      console.log('[useMcpStream] Falling back to continuous HTTP Polling...');
      setTransportType('POLLING');

      pollInterval = setInterval(() => {
        fetchStateSnapshot();
      }, 1500);
    }

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (sseRef.current) sseRef.current.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchStateSnapshot]);

  // Actions
  const triggerRingPreset = useCallback(async (preset) => {
    try {
      const res = await fetch(`${API_BASE}/webhooks/ring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      return await res.json();
    } catch (e) {
      console.error('[useMcpStream] Failed to trigger Ring webhook:', e);
    }
  }, []);

  const updateBeeContext = useCallback(async (telemetry) => {
    try {
      const res = await fetch(`${API_BASE}/telemetry/bee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetry),
      });
      return await res.json();
    } catch (e) {
      console.error('[useMcpStream] Failed to update Bee telemetry:', e);
    }
  }, []);

  const dismissPip = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISMISS_PIP' }),
      });
    } catch (e) {
      console.error('[useMcpStream] Failed to dismiss PiP:', e);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_PLAY_PAUSE' }),
      });
    } catch (e) {
      console.error('[useMcpStream] Failed to toggle play/pause:', e);
    }
  }, []);

  const toggleTwoWayTalk = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_MIC' }),
      });
    } catch (e) {
      console.error('[useMcpStream] Failed to toggle two-way talk:', e);
    }
  }, []);

  const askAlexaVoice = useCallback(async (utterance) => {
    setVoiceAssistantState({
      active: true,
      query: utterance,
      response: '',
      loading: true,
    });

    try {
      const res = await fetch(`${API_BASE}/api/alexa/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance }),
      });
      const data = await res.json();
      setVoiceAssistantState((prev) => ({
        ...prev,
        response: data.speech || 'All quiet at the door.',
        loading: false,
      }));
    } catch (e) {
      setVoiceAssistantState((prev) => ({
        ...prev,
        response: 'Alexa could not connect to Bedrock AgentCore.',
        loading: false,
      }));
    }
  }, []);

  const closeAlexaVoice = useCallback(() => {
    setVoiceAssistantState({ active: false, query: '', response: '', loading: false });
  }, []);

  const resetLivingRoom = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
    } catch (e) {
      console.error('[useMcpStream] Failed to reset state:', e);
    }
  }, []);

  const callMcpTool = useCallback(async (name, args = {}) => {
    try {
      const res = await fetch(`${API_BASE}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name, arguments: args },
        }),
      });
      return await res.json();
    } catch (e) {
      console.error('[useMcpStream] MCP tool call failed:', e);
    }
  }, []);

  return {
    state,
    connectionStatus,
    transportType,
    lastNotification,
    voiceAssistantState,
    triggerRingPreset,
    updateBeeContext,
    dismissPip,
    togglePlayPause,
    toggleTwoWayTalk,
    askAlexaVoice,
    closeAlexaVoice,
    resetLivingRoom,
    callMcpTool,
  };
}
