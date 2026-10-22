/**
 * ============================================================================
 * THE GHOST-DIRECTOR: CENTRAL LIVING ROOM STATE STORE
 * ============================================================================
 * Maintains the single source of truth for:
 * - Ring Video Doorbell presence & event stream
 * - Bee Wearable biometrics & cognitive focus telemetry
 * - Fire TV media playback & scene metadata
 * - Bedrock AgentCore decision logs & director commentary history
 * ============================================================================
 */

import { EventEmitter } from 'node:events';

class LivingRoomStateStore extends EventEmitter {
  constructor() {
    super();
    this.state = this.getInitialState();
  }

  getInitialState() {
    return {
      version: '1.0.0',
      systemStatus: 'ONLINE',
      mode: 'GHOST_DIRECTOR_ACTIVE',
      lastUpdated: new Date().toISOString(),

      // 1. FRONT DOOR (Ring Video Doorbell Pro)
      ring: {
        deviceModel: 'Ring Video Doorbell Pro 2',
        batteryLevel: 'Hardwired (100%)',
        status: 'CONNECTED',
        cameraFeedActive: true,
        currentSnapshotUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        twoWayTalkActive: false,
        lastEvent: {
          id: 'evt-init-001',
          eventType: 'MOTION',
          label: 'Front Porch Clear',
          confidence: 0.98,
          packageDetected: false,
          personName: null,
          timestamp: new Date().toISOString(),
          description: 'No active motion detected at entryway',
        },
        eventHistory: [],
      },

      // 2. WEARABLE (Bee Wearable Intelligence)
      bee: {
        deviceModel: 'Bee Alpha 1 (Context Wearable)',
        status: 'PAIRED_BLE',
        batteryLevel: 88,
        focusState: 'Relaxing', // 'Relaxing' | 'Deep Focus' | 'Active / Cooking' | 'Workout'
        focusIndex: 78, // 0 - 100
        heartRateBpm: 68,
        ambientNoiseDb: 38,
        stressLevel: 'Low',
        userLocation: 'Living Room Couch',
        lastTelemetryTimestamp: new Date().toISOString(),
      },

      // 3. LIVING ROOM (Fire TV 4K Max / Vega OS)
      fireTv: {
        deviceModel: 'Amazon Fire TV 4K Max (Vega OS Preview)',
        displayMode: '4K_UHD_16_9',
        title: 'Fallout — Season 2 (Exclusive Preview)',
        genre: 'Sci-Fi Action / Neo-Western',
        sceneIntensity: 'Action Climax', // 'Action Climax' | 'Dialogue / Quiet' | 'Suspense'
        isPlaying: true,
        baseVolume: 75,
        currentAudioDucking: 1.0, // 1.0 = full volume; 0.3 = 30% volume
        pipActive: false,
        pipData: null,
        subtitleWhisper: null,
        activeRemoteFocusedElement: 'pip-primary-action',
      },

      // 4. CLOUD BRAIN (Alexa+ MCP & Amazon Bedrock AgentCore)
      bedrock: {
        engine: 'Amazon Bedrock Runtime (Claude 3.5 Sonnet / Nova Pro)',
        agentStatus: 'LISTENING',
        totalInvocations: 0,
        averageLatencyMs: 185,
        lastDecision: null,
        decisionHistory: [],
      },
    };
  }

  getState() {
    return this.state;
  }

  updateRingEvent(event) {
    const enrichedEvent = {
      id: event.id || `ring-evt-${Date.now()}`,
      eventType: event.eventType || 'MOTION',
      label: event.label || 'Front Entry Motion',
      confidence: event.confidence ?? 0.92,
      packageDetected: Boolean(event.packageDetected),
      personName: event.personName || null,
      description: event.description || 'Activity logged at front door',
      snapshotUrl: event.snapshotUrl || this.state.ring.currentSnapshotUrl,
      timestamp: new Date().toISOString(),
    };

    this.state.ring.lastEvent = enrichedEvent;
    this.state.ring.eventHistory.unshift(enrichedEvent);
    if (this.state.ring.eventHistory.length > 25) {
      this.state.ring.eventHistory.pop();
    }
    this.state.lastUpdated = new Date().toISOString();

    this.emit('stateChanged', {
      type: 'RING_EVENT_UPDATED',
      payload: enrichedEvent,
      fullState: this.state,
    });

    return enrichedEvent;
  }

  updateBeeTelemetry(telemetry) {
    this.state.bee = {
      ...this.state.bee,
      ...telemetry,
      lastTelemetryTimestamp: new Date().toISOString(),
    };
    this.state.lastUpdated = new Date().toISOString();

    this.emit('stateChanged', {
      type: 'BEE_TELEMETRY_UPDATED',
      payload: this.state.bee,
      fullState: this.state,
    });

    return this.state.bee;
  }

  updateFireTvState(fireTvUpdates) {
    this.state.fireTv = {
      ...this.state.fireTv,
      ...fireTvUpdates,
    };
    this.state.lastUpdated = new Date().toISOString();

    this.emit('stateChanged', {
      type: 'FIRE_TV_UPDATED',
      payload: this.state.fireTv,
      fullState: this.state,
    });

    return this.state.fireTv;
  }

  recordBedrockDecision(decision) {
    this.state.bedrock.totalInvocations += 1;
    this.state.bedrock.lastDecision = decision;
    this.state.bedrock.decisionHistory.unshift(decision);
    if (this.state.bedrock.decisionHistory.length > 25) {
      this.state.bedrock.decisionHistory.pop();
    }

    // Apply director action automatically to Fire TV state
    if (decision.action === 'CINEMATIC_PIP') {
      this.state.fireTv.pipActive = true;
      this.state.fireTv.pipData = decision;
      this.state.fireTv.currentAudioDucking = decision.audioDuckingLevel ?? 0.35;
      this.state.fireTv.subtitleWhisper = null;
    } else if (decision.action === 'SMART_PAUSE') {
      this.state.fireTv.isPlaying = false;
      this.state.fireTv.pipActive = true;
      this.state.fireTv.pipData = decision;
      this.state.fireTv.currentAudioDucking = 0.15;
    } else if (decision.action === 'AMBIENT_WHISPER') {
      this.state.fireTv.pipActive = false;
      this.state.fireTv.subtitleWhisper = decision.directorCommentary;
      this.state.fireTv.currentAudioDucking = decision.audioDuckingLevel ?? 0.85;
    } else if (decision.action === 'SUPPRESS_LOG') {
      this.state.fireTv.pipActive = false;
      this.state.fireTv.subtitleWhisper = null;
      this.state.fireTv.currentAudioDucking = 1.0;
    }

    this.state.lastUpdated = new Date().toISOString();

    this.emit('stateChanged', {
      type: 'BEDROCK_DECISION_EXECUTED',
      payload: decision,
      fullState: this.state,
    });

    return decision;
  }

  dismissPip() {
    this.state.fireTv.pipActive = false;
    this.state.fireTv.pipData = null;
    this.state.fireTv.subtitleWhisper = null;
    this.state.fireTv.currentAudioDucking = 1.0;
    this.state.lastUpdated = new Date().toISOString();

    this.emit('stateChanged', {
      type: 'PIP_DISMISSED',
      payload: { pipActive: false },
      fullState: this.state,
    });
  }

  resetToDefaults() {
    this.state = this.getInitialState();
    this.emit('stateChanged', {
      type: 'STATE_RESET',
      payload: {},
      fullState: this.state,
    });
  }
}

export const livingRoomStore = new LivingRoomStateStore();
