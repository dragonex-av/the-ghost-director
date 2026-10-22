/**
 * ============================================================================
 * THE GHOST-DIRECTOR: ALEXA+ MODEL CONTEXT PROTOCOL (MCP) SERVER
 * ============================================================================
 * Amazon Developer Hackathon: Living Room (Fire TV) + Front Door (Ring) +
 * Brain (Alexa+ MCP + AWS Bedrock AgentCore) + Wearable Intelligence (Bee)
 *
 * Implements:
 * 1. MCP Streamable HTTP Spec (2024-11-05 / 2025-11-25+) at /mcp (POST & GET SSE)
 * 2. Ring Video Doorbell Webhook Receiver at /webhooks/ring
 * 3. Bee Wearable Telemetry Ingestion Receiver at /telemetry/bee
 * 4. Bi-directional WebSocket & Server-Sent Events (SSE) for Fire TV 4K / Vega OS
 * 5. Direct Alexa Voice Assistant Queries & Living Room Command Dispatcher
 * 6. Automated Hackathon Scenario Runner (/api/demo/run-scenario)
 * ============================================================================
 */

import http from 'node:http';
import { parse as parseUrl } from 'node:url';
import { livingRoomStore } from './stateStore.js';
import { handleMcpRpc, MCP_SERVER_INFO } from './mcpProtocol.js';
import { handleRingWebhook } from './ringWebhookHandler.js';
import { handleBeeTelemetry } from './beeTelemetryHandler.js';
import { generateDirectorScript, generateAlexaVoiceResponse } from './awsBedrockClient.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Connected SSE clients (Fire TV apps, dashboards, judge consoles)
const sseClients = new Set();
// Connected MCP stream clients
const mcpStreamClients = new Set();
// Connected WebSockets
const wsClients = new Set();

/**
 * Broadcast state update to all connected Fire TV clients, dashboards, and MCP listeners
 */
function broadcastLivingRoomUpdate(eventData) {
  const payloadStr = JSON.stringify(eventData);

  // 1. Broadcast to SSE clients (/api/events)
  for (const client of sseClients) {
    try {
      client.write(`event: ${eventData.type}\n`);
      client.write(`data: ${payloadStr}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }

  // 2. Broadcast to MCP SSE clients (/mcp GET)
  for (const client of mcpStreamClients) {
    try {
      client.write(`event: message\n`);
      client.write(`data: ${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/stateChanged', params: eventData })}\n\n`);
    } catch {
      mcpStreamClients.delete(client);
    }
  }

  // 3. Broadcast to WebSockets
  for (const ws of wsClients) {
    try {
      if (ws.readyState === 1 /* OPEN */) {
        ws.send(payloadStr);
      }
    } catch {
      wsClients.delete(ws);
    }
  }
}

// Subscribe state store changes to broadcasting pipeline
livingRoomStore.on('stateChanged', (eventData) => {
  broadcastLivingRoomUpdate(eventData);
});

// Periodic heartbeat keep-alive to keep all SSE streams open
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 10000);

/**
 * Primary HTTP Request Dispatcher
 */
async function handleHttpRequest(req, res) {
  // CORS Headers for browser dashboards and Fire TV web applications
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mcp-version, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = parseUrl(req.url, true);
  const pathname = parsed.pathname || '/';

  // Helper to parse JSON body
  const parseJsonBody = () =>
    new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });

  // Helper to send JSON response
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // ========================================================================
    // 1. HEALTH & METADATA
    // ========================================================================
    if (pathname === '/health' || pathname === '/') {
      return sendJson(200, {
        status: 'ONLINE',
        service: 'The Ghost-Director Alexa+ MCP Server',
        version: MCP_SERVER_INFO.version,
        spec: 'MCP Streamable HTTP (2025-11-25+)',
        connectedSseClients: sseClients.size,
        connectedWsClients: wsClients.size,
        livingRoomStatus: livingRoomStore.getState().systemStatus,
        bedrockStatus: livingRoomStore.getState().bedrock.agentStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // 2. MODEL CONTEXT PROTOCOL (MCP) STREAMABLE HTTP SPEC ENDPOINTS
    // ========================================================================

    // POST /mcp - JSON-RPC 2.0 Command Execution & Tool Invocations
    if (pathname === '/mcp' && req.method === 'POST') {
      const rpcPayload = await parseJsonBody();
      console.log(`[MCP POST] Received JSON-RPC method: ${rpcPayload?.method}`);

      const response = await handleMcpRpc(rpcPayload);
      if (response === null) {
        res.writeHead(204); // No content for notifications
        res.end();
        return;
      }
      return sendJson(200, response);
    }

    // GET /mcp - Server-Sent Events (SSE) Streamable HTTP Transport
    if (pathname === '/mcp' && req.method === 'GET') {
      console.log('[MCP GET] New MCP Streamable HTTP client connected.');
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.write(`: connected to the-ghost-director-alexa-mcp\n\n`);

      mcpStreamClients.add(res);
      req.on('close', () => {
        mcpStreamClients.delete(res);
        console.log('[MCP GET] MCP Streamable client disconnected.');
      });
      return;
    }

    // ========================================================================
    // 3. HARDWARE & WEARABLE WEBHOOK INGESTION
    // ========================================================================

    // POST /webhooks/ring - Ring Video Doorbell Ingestion
    if (pathname === '/webhooks/ring' && req.method === 'POST') {
      const body = await parseJsonBody();
      req.body = body;
      return handleRingWebhook(req, {
        status: (code) => ({
          json: (data) => sendJson(code, data),
        }),
      });
    }

    // POST /telemetry/bee - Bee Wearable Telemetry Ingestion
    if (pathname === '/telemetry/bee' && req.method === 'POST') {
      const body = await parseJsonBody();
      req.body = body;
      return handleBeeTelemetry(req, {
        status: (code) => ({
          json: (data) => sendJson(code, data),
        }),
      });
    }

    // ========================================================================
    // 4. FIRE TV REAL-TIME STREAMING & LIVING ROOM API
    // ========================================================================

    // GET /api/state - Complete Unified State
    if (pathname === '/api/state' && req.method === 'GET') {
      return sendJson(200, livingRoomStore.getState());
    }

    // GET /api/events - Fire TV & Dashboard SSE Channel
    if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.write(`event: INITIAL_STATE\ndata: ${JSON.stringify(livingRoomStore.getState())}\n\n`);

      sseClients.add(res);
      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // POST /api/action - Fire TV Remote Commands & PiP Modulation
    if (pathname === '/api/action' && req.method === 'POST') {
      const { action, payload } = await parseJsonBody();
      if (action === 'DISMISS_PIP') {
        livingRoomStore.dismissPip();
        return sendJson(200, { success: true, message: 'PiP dismissed' });
      }
      if (action === 'TOGGLE_PLAY_PAUSE') {
        const currentPlaying = livingRoomStore.getState().fireTv.isPlaying;
        livingRoomStore.updateFireTvState({ isPlaying: !currentPlaying });
        return sendJson(200, { success: true, isPlaying: !currentPlaying });
      }
      if (action === 'SET_DUCKING') {
        livingRoomStore.updateFireTvState({ currentAudioDucking: payload?.duckingLevel ?? 1.0 });
        return sendJson(200, { success: true, ducking: payload?.duckingLevel });
      }
      if (action === 'TOGGLE_MIC') {
        const state = livingRoomStore.getState();
        state.ring.twoWayTalkActive = !state.ring.twoWayTalkActive;
        livingRoomStore.emit('stateChanged', {
          type: 'TWO_WAY_TALK_TOGGLED',
          payload: { active: state.ring.twoWayTalkActive },
          fullState: state,
        });
        return sendJson(200, { success: true, twoWayTalkActive: state.ring.twoWayTalkActive });
      }
      return sendJson(400, { error: `Unrecognized action: ${action}` });
    }

    // POST /api/alexa/voice - Spoken Voice Query via Bedrock
    if (pathname === '/api/alexa/voice' && req.method === 'POST') {
      const { utterance } = await parseJsonBody();
      const response = await generateAlexaVoiceResponse({
        utterance: utterance || 'Who is at the front door?',
        livingRoomState: livingRoomStore.getState(),
      });
      return sendJson(200, response);
    }

    // POST /api/demo/run-scenario - Automated 1-Click Guided Scenario Tour
    if (pathname === '/api/demo/run-scenario' && req.method === 'POST') {
      const { scenario } = await parseJsonBody();
      console.log(`[DemoRunner] Executing automated scenario: ${scenario}`);

      if (scenario === 'prime') {
        // Step 1: Ensure Fire TV is playing and Bee is relaxed
        livingRoomStore.updateFireTvState({ isPlaying: true, baseVolume: 75, currentAudioDucking: 1.0 });
        livingRoomStore.updateBeeTelemetry({ focusState: 'Relaxing', focusIndex: 72, heartRateBpm: 68 });

        // Step 2: Inject Prime delivery
        const ringEvent = livingRoomStore.updateRingEvent({
          eventType: 'DELIVERY',
          label: 'Amazon Delivery Associate',
          packageDetected: true,
          confidence: 0.98,
          snapshotUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
          description: 'Courier placed Amazon package on front mat.',
        });

        // Step 3: Bedrock AgentCore evaluation
        const decision = await generateDirectorScript({
          ringEvent,
          beeContext: livingRoomStore.getState().bee,
          fireTvState: livingRoomStore.getState().fireTv,
        });

        livingRoomStore.recordBedrockDecision(decision);
        return sendJson(200, { success: true, scenario, decision });
      }

      if (scenario === 'stranger') {
        livingRoomStore.updateFireTvState({ isPlaying: true, baseVolume: 80 });
        livingRoomStore.updateBeeTelemetry({ focusState: 'Relaxing', focusIndex: 65, heartRateBpm: 82 });

        const ringEvent = livingRoomStore.updateRingEvent({
          eventType: 'STRANGER',
          label: 'Unrecognized Person Pacing Porch',
          packageDetected: false,
          confidence: 0.94,
          snapshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          description: 'Individual lingering at entryway for over 45 seconds without knocking.',
        });

        const decision = await generateDirectorScript({
          ringEvent,
          beeContext: livingRoomStore.getState().bee,
          fireTvState: livingRoomStore.getState().fireTv,
        });

        livingRoomStore.recordBedrockDecision(decision);
        return sendJson(200, { success: true, scenario, decision });
      }

      if (scenario === 'deep-focus') {
        // Deep focus mode: 96% focus score
        livingRoomStore.updateBeeTelemetry({ focusState: 'Deep Focus', focusIndex: 96, heartRateBpm: 84 });
        livingRoomStore.updateFireTvState({ isPlaying: true });

        const ringEvent = livingRoomStore.updateRingEvent({
          eventType: 'MOTION',
          label: 'Front Porch Motion',
          packageDetected: false,
          confidence: 0.88,
          snapshotUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
          description: 'Motion detected while resident is in Deep Immersion.',
        });

        const decision = await generateDirectorScript({
          ringEvent,
          beeContext: livingRoomStore.getState().bee,
          fireTvState: livingRoomStore.getState().fireTv,
        });

        livingRoomStore.recordBedrockDecision(decision);
        return sendJson(200, { success: true, scenario, decision });
      }

      if (scenario === 'family') {
        livingRoomStore.updateBeeTelemetry({ focusState: 'Relaxing', focusIndex: 70, heartRateBpm: 72 });
        const ringEvent = livingRoomStore.updateRingEvent({
          eventType: 'FAMILY',
          label: 'Sarah Arrived Home',
          personName: 'Sarah',
          confidence: 0.97,
          snapshotUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
          description: 'Recognized face profile: Sarah entering porch.',
        });

        const decision = await generateDirectorScript({
          ringEvent,
          beeContext: livingRoomStore.getState().bee,
          fireTvState: livingRoomStore.getState().fireTv,
        });

        livingRoomStore.recordBedrockDecision(decision);
        return sendJson(200, { success: true, scenario, decision });
      }

      return sendJson(400, { error: 'Unknown scenario' });
    }

    // POST /api/reset - Reset living room to clean demo state
    if (pathname === '/api/reset' && req.method === 'POST') {
      livingRoomStore.resetToDefaults();
      return sendJson(200, { success: true, message: 'Living room state reset to baseline' });
    }

    // 404 Route Not Found
    return sendJson(404, { error: 'Route not found on Ghost-Director MCP Server', pathname });
  } catch (err) {
    console.error('[HttpError]', err);
    return sendJson(500, { error: 'Internal Server Error', message: err.message });
  }
}

// Create HTTP server
const server = http.createServer(handleHttpRequest);

// Setup lightweight WebSocket support for real-time bidirectional synchronization
server.on('upgrade', (request, socket, head) => {
  const { pathname } = parseUrl(request.url);

  if (pathname === '/ws') {
    // Native WebSocket Upgrade Handshake
    const key = request.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    import('node:crypto').then(({ createHash }) => {
      const digest = createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${digest}`,
      ];

      socket.write(headers.join('\r\n') + '\r\n\r\n');

      const wsClient = {
        readyState: 1,
        send: (msg) => {
          try {
            const payloadBuffer = Buffer.from(msg, 'utf8');
            const length = payloadBuffer.length;
            let header;

            if (length < 126) {
              header = Buffer.from([0x81, length]);
            } else if (length < 65536) {
              header = Buffer.alloc(4);
              header[0] = 0x81;
              header[1] = 126;
              header.writeUInt16BE(length, 2);
            } else {
              header = Buffer.alloc(10);
              header[0] = 0x81;
              header[1] = 127;
              header.writeBigUInt64BE(BigInt(length), 2);
            }

            socket.write(Buffer.concat([header, payloadBuffer]));
          } catch {
            wsClients.delete(wsClient);
          }
        },
      };

      wsClients.add(wsClient);
      console.log('[WebSocket] Fire TV / Dashboard connected over WebSocket.');

      // Send initial state immediately
      wsClient.send(
        JSON.stringify({
          type: 'INITIAL_STATE',
          fullState: livingRoomStore.getState(),
        })
      );

      socket.on('close', () => {
        wsClient.readyState = 3;
        wsClients.delete(wsClient);
      });

      socket.on('error', () => {
        wsClients.delete(wsClient);
      });
    });
  }
});

// Launch server
server.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   🎬 THE GHOST-DIRECTOR ALEXA+ MCP SERVER                 ║
║               Amazon Developer Hackathon: Living Room Ambient AI           ║
╠════════════════════════════════════════════════════════════════════════════╣
║  • Host & Port:            http://${HOST}:${PORT}                              ║
║  • MCP Endpoint:           POST http://${HOST}:${PORT}/mcp                     ║
║  • MCP Streamable (SSE):   GET  http://${HOST}:${PORT}/mcp                     ║
║  • Ring Webhook Endpoint:  POST http://${HOST}:${PORT}/webhooks/ring           ║
║  • Bee Telemetry Endpoint: POST http://${HOST}:${PORT}/telemetry/bee           ║
║  • Fire TV Stream (SSE):   GET  http://${HOST}:${PORT}/api/events              ║
║  • WebSocket Stream:       ws://${HOST}:${PORT}/ws                             ║
║  • Demo Runner:            POST http://${HOST}:${PORT}/api/demo/run-scenario   ║
║  • AWS Bedrock Engine:     claude-3-5-sonnet-20241022-v2:0 / AgentCore     ║
╚════════════════════════════════════════════════════════════════════════════╝
`);
});
