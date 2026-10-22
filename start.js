/**
 * ============================================================================
 * THE GHOST-DIRECTOR: ROOT ORCHESTRATION ENGINE
 * ============================================================================
 * Launches both the Alexa+ MCP Server (:3001) and the Fire TV Living Room
 * Web App (:3000) concurrently with unified logging and graceful shutdown.
 * ============================================================================
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   🎬 THE GHOST-DIRECTOR ORCHESTRATOR                      ║
║               Amazon Developer Hackathon: Living Room Ambient AI           ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// 1. Spawn MCP Server on Port 3001
const mcpProcess = spawn('node', ['mcp-server-alexa/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' },
});

// 2. Spawn Fire TV App Server on Port 3000
const fireTvProcess = spawn('node', ['fire-tv-app/serve.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: '3000', MCP_PORT: '3001' },
});

// Handle graceful termination
const cleanup = () => {
  console.log('\n[Orchestrator] Shutting down The Ghost-Director services...');
  mcpProcess.kill('SIGINT');
  fireTvProcess.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
