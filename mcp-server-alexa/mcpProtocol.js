/**
 * ============================================================================
 * THE GHOST-DIRECTOR: MODEL CONTEXT PROTOCOL (MCP) ENGINE
 * ============================================================================
 * Conforms to the MCP Streamable HTTP Specification (2024-11-05 / 2025-11-25+)
 * Exposes Tools, Resources, and Prompts to Alexa+ AI Agents and Claude/Bedrock
 * ============================================================================
 */

import { livingRoomStore } from './stateStore.js';
import { generateDirectorScript, generateAlexaVoiceResponse } from './awsBedrockClient.js';

export const MCP_SERVER_INFO = {
  name: 'the-ghost-director-alexa-mcp',
  version: '1.2.0',
  description: 'Alexa+ MCP Living Room Director: Fusing Fire TV, Ring Video Doorbell, and Bee Wearable Intelligence via AWS Bedrock',
  protocolVersion: '2024-11-05',
};

/**
 * List of registered MCP Tools
 */
export const MCP_TOOLS = [
  {
    name: 'evaluate_ambient_interruption',
    description: 'Evaluates real-time front door Ring activity alongside Bee wearable biometrics and Fire TV media context to determine the optimal cinematic interruption policy (PiP, Smart Pause, Whisper, or Suppress) using AWS Bedrock AgentCore.',
    inputSchema: {
      type: 'object',
      properties: {
        ringEvent: {
          type: 'object',
          description: 'Details of the Ring event (eventType, label, packageDetected, confidence, personName)',
        },
        beeTelemetry: {
          type: 'object',
          description: 'Bee wearable context (focusState, focusIndex, heartRateBpm, ambientNoiseDb)',
        },
        fireTvState: {
          type: 'object',
          description: 'Current Fire TV playback state (title, genre, sceneIntensity, isPlaying, volume)',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_director_script',
    description: 'Generates a stylized Hollywood cinematic director commentary script and audio ducking parameters tailored to current viewer immersion and visitor intent.',
    inputSchema: {
      type: 'object',
      properties: {
        tone: {
          type: 'string',
          enum: ['cinematic', 'concise', 'urgent', 'ambient'],
          description: 'Desired stylistic tone of the director narration',
        },
      },
    },
  },
  {
    name: 'dispatch_fire_tv_command',
    description: 'Directly dispatches a remote control command to the Amazon Fire TV display (toggle PiP, set audio ducking level, pause, play, dismiss).',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['PIP_SHOW', 'PIP_DISMISS', 'PAUSE', 'PLAY', 'SET_AUDIO_DUCKING', 'TOGGLE_MIC'],
          description: 'Action command to execute on Fire TV',
        },
        duckingLevel: {
          type: 'number',
          description: 'Volume ducking multiplier (0.1 to 1.0) when command is SET_AUDIO_DUCKING',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'trigger_ring_event',
    description: 'Simulates or ingests a Ring Video Doorbell motion, package, or chime event into the Ghost-Director pipeline.',
    inputSchema: {
      type: 'object',
      properties: {
        eventType: { type: 'string', enum: ['DOORBELL', 'DELIVERY', 'STRANGER', 'MOTION', 'FAMILY'] },
        label: { type: 'string' },
        packageDetected: { type: 'boolean' },
        personName: { type: 'string' },
        snapshotUrl: { type: 'string' },
      },
      required: ['eventType'],
    },
  },
  {
    name: 'update_bee_telemetry',
    description: 'Ingests real-time biometric and focus state telemetry from the Bee Wearable device.',
    inputSchema: {
      type: 'object',
      properties: {
        focusState: { type: 'string', enum: ['Relaxing', 'Deep Focus', 'Active / Cooking', 'Workout'] },
        focusIndex: { type: 'number', minimum: 0, maximum: 100 },
        heartRateBpm: { type: 'number' },
        ambientNoiseDb: { type: 'number' },
      },
    },
  },
  {
    name: 'get_living_room_state',
    description: 'Fetches the consolidated real-time state of the living room (Ring Doorbell, Bee Wearable, Fire TV, and Bedrock Director Logs).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * List of registered MCP Resources
 */
export const MCP_RESOURCES = [
  {
    uri: 'ambient://living-room/state',
    name: 'Living Room Unified Ambient State',
    mimeType: 'application/json',
    description: 'Consolidated real-time state snapshot of Fire TV, Ring Video Doorbell, and Bee Wearable',
  },
  {
    uri: 'ambient://ring/doorbell-feed',
    name: 'Ring Doorbell Telemetry Feed',
    mimeType: 'application/json',
    description: 'Current front door camera status, detection logs, and latest snapshot metadata',
  },
  {
    uri: 'ambient://bee/biometrics',
    name: 'Bee Wearable Biometric Stream',
    mimeType: 'application/json',
    description: 'Streaming cognitive focus score, heart rate BPM, and ambient audio environment',
  },
  {
    uri: 'ambient://bedrock/director-decisions',
    name: 'AWS Bedrock AgentCore Decisions Audit Trail',
    mimeType: 'application/json',
    description: 'Historical audit trail of all AI director evaluations and commentary generated by Bedrock',
  },
];

/**
 * List of registered MCP Prompts
 */
export const MCP_PROMPTS = [
  {
    name: 'cinematic_director_prompt',
    description: 'System prompt template for transforming smart home events into seamless Hollywood director interventions',
    arguments: [
      {
        name: 'scene_intensity',
        description: 'Intensity of the active Fire TV scene',
        required: false,
      },
    ],
  },
  {
    name: 'alexa_voice_consultation_prompt',
    description: 'Prompt template for Alexa+ responding to Fire TV voice remote queries about living room events',
    arguments: [
      {
        name: 'user_query',
        description: 'Spoken question from user',
        required: true,
      },
    ],
  },
];

/**
 * Handles JSON-RPC 2.0 messages conforming to MCP Streamable HTTP Spec
 * @param {Object} message - Incoming JSON-RPC payload
 * @returns {Promise<Object>} JSON-RPC response
 */
export async function handleMcpRpc(message) {
  const { id, method, params } = message;

  try {
    switch (method) {
      // 1. Initialize Protocol Handshake
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_SERVER_INFO.protocolVersion,
            serverInfo: {
              name: MCP_SERVER_INFO.name,
              version: MCP_SERVER_INFO.version,
            },
            capabilities: {
              tools: { listChanged: true },
              resources: { subscribe: true, listChanged: true },
              prompts: { listChanged: true },
              logging: {},
            },
          },
        };
      }

      // 2. Client Confirmation Notification
      case 'notifications/initialized': {
        return null; // Notifications return no response in JSON-RPC
      }

      // 3. Ping / Heartbeat
      case 'ping': {
        return {
          jsonrpc: '2.0',
          id,
          result: {},
        };
      }

      // 4. Tools Listing
      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };
      }

      // 5. Tools Invocation
      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const callResult = await executeTool(toolName, toolArgs);

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof callResult === 'string' ? callResult : JSON.stringify(callResult, null, 2),
              },
            ],
          },
        };
      }

      // 6. Resources Listing
      case 'resources/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: MCP_RESOURCES,
          },
        };
      }

      // 7. Resource Reading
      case 'resources/read': {
        const uri = params?.uri;
        const resourceContent = readResource(uri);

        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(resourceContent, null, 2),
              },
            ],
          },
        };
      }

      // 8. Prompts Listing
      case 'prompts/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: MCP_PROMPTS,
          },
        };
      }

      // 9. Prompt Retrieval
      case 'prompts/get': {
        const promptName = params?.name;
        const promptArgs = params?.arguments || {};

        if (promptName === 'cinematic_director_prompt') {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              description: 'Cinematic Director Prompt Template',
              messages: [
                {
                  role: 'system',
                  content: {
                    type: 'text',
                    text: 'You are The Ghost-Director. Evaluate Fire TV media context, Bee wearable biometrics, and Ring front-door vision to craft smooth, cinematic interventions.',
                  },
                },
              ],
            },
          };
        }

        throw new Error(`Prompt '${promptName}' not recognized`);
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method '${method}' not found on Ghost-Director MCP server`,
          },
        };
      }
    }
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err.message,
      },
    };
  }
}

/**
 * Executes a registered tool call
 */
async function executeTool(name, args) {
  const currentState = livingRoomStore.getState();

  switch (name) {
    case 'evaluate_ambient_interruption': {
      const ringEvent = args.ringEvent || currentState.ring.lastEvent;
      const beeContext = args.beeTelemetry || currentState.bee;
      const fireTvState = args.fireTvState || currentState.fireTv;

      const decision = await generateDirectorScript({ ringEvent, beeContext, fireTvState });
      livingRoomStore.recordBedrockDecision(decision);
      return decision;
    }

    case 'generate_director_script': {
      const decision = await generateDirectorScript({
        ringEvent: currentState.ring.lastEvent,
        beeContext: currentState.bee,
        fireTvState: currentState.fireTv,
      });
      return decision;
    }

    case 'dispatch_fire_tv_command': {
      const { command, duckingLevel } = args;
      if (command === 'PIP_DISMISS') {
        livingRoomStore.dismissPip();
        return { success: true, message: 'PiP overlay dismissed, audio restored' };
      }
      if (command === 'PAUSE') {
        livingRoomStore.updateFireTvState({ isPlaying: false });
        return { success: true, message: 'Fire TV media paused' };
      }
      if (command === 'PLAY') {
        livingRoomStore.updateFireTvState({ isPlaying: true });
        return { success: true, message: 'Fire TV media resumed' };
      }
      if (command === 'SET_AUDIO_DUCKING') {
        livingRoomStore.updateFireTvState({ currentAudioDucking: duckingLevel ?? 0.5 });
        return { success: true, message: `Audio ducked to ${duckingLevel}` };
      }
      if (command === 'TOGGLE_MIC') {
        const currentTalk = currentState.ring.twoWayTalkActive;
        currentState.ring.twoWayTalkActive = !currentTalk;
        livingRoomStore.emit('stateChanged', {
          type: 'TWO_WAY_TALK_TOGGLED',
          payload: { active: !currentTalk },
          fullState: currentState,
        });
        return { success: true, twoWayTalkActive: !currentTalk };
      }
      return { success: false, error: 'Unknown command' };
    }

    case 'trigger_ring_event': {
      const updatedEvent = livingRoomStore.updateRingEvent(args);
      // Automatically trigger Ghost-Director evaluation via Bedrock AgentCore
      const decision = await generateDirectorScript({
        ringEvent: updatedEvent,
        beeContext: currentState.bee,
        fireTvState: currentState.fireTv,
      });
      livingRoomStore.recordBedrockDecision(decision);
      return { event: updatedEvent, decision };
    }

    case 'update_bee_telemetry': {
      const updatedBee = livingRoomStore.updateBeeTelemetry(args);
      return updatedBee;
    }

    case 'get_living_room_state': {
      return currentState;
    }

    default:
      throw new Error(`Tool '${name}' is not registered`);
  }
}

/**
 * Reads an ambient resource by URI
 */
function readResource(uri) {
  const state = livingRoomStore.getState();

  switch (uri) {
    case 'ambient://living-room/state':
      return state;
    case 'ambient://ring/doorbell-feed':
      return state.ring;
    case 'ambient://bee/biometrics':
      return state.bee;
    case 'ambient://bedrock/director-decisions':
      return {
        totalInvocations: state.bedrock.totalInvocations,
        lastDecision: state.bedrock.lastDecision,
        history: state.bedrock.decisionHistory,
      };
    default:
      throw new Error(`Resource '${uri}' not found`);
  }
}
