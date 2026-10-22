/**
 * ============================================================================
 * THE GHOST-DIRECTOR: AUTOMATED TEST SUITE FOR MCP SERVER
 * ============================================================================
 * Tests:
 * 1. MCP Streamable HTTP JSON-RPC Handshake (initialize, ping)
 * 2. Tool Discovery (tools/list)
 * 3. Multimodal Ambient Interruption Evaluation (tools/call -> Bedrock)
 * 4. Resource Inspection (resources/read)
 * 5. State Store Pub/Sub Lifecycle
 * ============================================================================
 */

import assert from 'node:assert';
import { handleMcpRpc, MCP_TOOLS, MCP_RESOURCES } from '../mcpProtocol.js';
import { livingRoomStore } from '../stateStore.js';
import { generateDirectorScript } from '../awsBedrockClient.js';

async function runTests() {
  console.log('🧪 Starting The Ghost-Director MCP Automated Tests...\n');

  // Test 1: JSON-RPC Initialize
  console.log('Test 1: Testing MCP initialize handshake...');
  const initResponse = await handleMcpRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'HackathonJudgeClient', version: '1.0.0' },
    },
  });
  assert.strictEqual(initResponse.jsonrpc, '2.0');
  assert.strictEqual(initResponse.id, 1);
  assert.strictEqual(initResponse.result.serverInfo.name, 'the-ghost-director-alexa-mcp');
  assert.ok(initResponse.result.capabilities.tools);
  console.log('✅ Test 1 Passed: Handshake established.\n');

  // Test 2: Tools Listing
  console.log('Test 2: Verifying MCP tools/list...');
  const toolsResponse = await handleMcpRpc({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  assert.ok(Array.isArray(toolsResponse.result.tools));
  assert.strictEqual(toolsResponse.result.tools.length, MCP_TOOLS.length);
  const toolNames = toolsResponse.result.tools.map((t) => t.name);
  assert.ok(toolNames.includes('evaluate_ambient_interruption'));
  assert.ok(toolNames.includes('dispatch_fire_tv_command'));
  assert.ok(toolNames.includes('trigger_ring_event'));
  console.log(`✅ Test 2 Passed: Found ${toolNames.length} tools: ${toolNames.join(', ')}\n`);

  // Test 3: Bedrock AgentCore Interruption Evaluation
  console.log('Test 3: Testing AWS Bedrock AgentCore evaluation...');
  const bedrockResult = await generateDirectorScript({
    ringEvent: {
      eventType: 'DELIVERY',
      label: 'Amazon Prime Courier with Package',
      packageDetected: true,
      confidence: 0.96,
    },
    beeContext: {
      focusState: 'Relaxing',
      focusIndex: 78,
      heartRateBpm: 70,
    },
    fireTvState: {
      title: 'Fallout - Season 2',
      genre: 'Sci-Fi Action',
      sceneIntensity: 'Action Climax',
      isPlaying: true,
    },
  });

  assert.ok(bedrockResult.action);
  assert.ok(bedrockResult.directorCommentary);
  assert.ok(bedrockResult.urgency);
  assert.ok(typeof bedrockResult.audioDuckingLevel === 'number');
  console.log(`✅ Test 3 Passed: Bedrock Action: ${bedrockResult.action}, Commentary: "${bedrockResult.directorCommentary}"\n`);

  // Test 4: Resource Reading
  console.log('Test 4: Reading ambient://living-room/state resource...');
  const resResponse = await handleMcpRpc({
    jsonrpc: '2.0',
    id: 4,
    method: 'resources/read',
    params: { uri: 'ambient://living-room/state' },
  });
  assert.strictEqual(resResponse.result.contents[0].uri, 'ambient://living-room/state');
  const readState = JSON.parse(resResponse.result.contents[0].text);
  assert.strictEqual(readState.systemStatus, 'ONLINE');
  assert.ok(readState.fireTv);
  console.log('✅ Test 4 Passed: Ambient state resource accessible.\n');

  // Test 5: Tool Call: Trigger Ring Event
  console.log('Test 5: Ingesting simulated Ring Doorbell event via MCP...');
  const triggerResponse = await handleMcpRpc({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'trigger_ring_event',
      arguments: {
        eventType: 'STRANGER',
        label: 'Suspicious Individual Pacing Entryway',
        confidence: 0.93,
        packageDetected: false,
      },
    },
  });
  assert.ok(triggerResponse.result.content[0].text);
  const parsedTrigger = JSON.parse(triggerResponse.result.content[0].text);
  assert.strictEqual(parsedTrigger.event.eventType, 'STRANGER');
  assert.strictEqual(parsedTrigger.decision.urgency, 'HIGH');
  console.log('✅ Test 5 Passed: Ring event triggered, Bedrock elevated urgency to HIGH.\n');

  console.log('🎉 ALL MCP AND BEDROCK TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
