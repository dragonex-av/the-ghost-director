/**
 * ============================================================================
 * THE GHOST-DIRECTOR: FIRE TV APP SERVER & BIDIRECTIONAL REVERSE PROXY
 * ============================================================================
 * Serves the Fire TV living room UI on port 3000 and proxies all API, MCP,
 * webhook, and WebSocket (/ws) connections to the MCP server on port 3001.
 * ============================================================================
 */

import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const MCP_PORT = process.env.MCP_PORT || 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Proxy API, MCP, Webhook, and Telemetry requests directly to MCP Server
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/mcp') ||
    url.pathname.startsWith('/webhooks') ||
    url.pathname.startsWith('/telemetry') ||
    url.pathname === '/health'
  ) {
    const proxyReq = http.request(
      {
        host: '127.0.0.1',
        port: MCP_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ghost-Director MCP Server unreachable on port ' + MCP_PORT, details: err.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  // Serve static UI files
  let filePath = path.join(__dirname, 'dist', url.pathname === '/' ? 'index.html' : url.pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'standalone.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  });
});

// Proxy WebSocket upgrade requests to MCP Server (:3001)
server.on('upgrade', (req, socket, head) => {
  const proxySocket = net.connect(MCP_PORT, '127.0.0.1', () => {
    let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      rawHeaders += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    }
    rawHeaders += '\r\n';

    proxySocket.write(rawHeaders);
    if (head && head.length > 0) {
      proxySocket.write(head);
    }
    socket.pipe(proxySocket).pipe(socket);
  });

  proxySocket.on('error', () => {
    socket.destroy();
  });
});

server.listen(PORT, () => {
  console.log(`[FireTV App] Running on http://localhost:${PORT} (Proxying to MCP on :${MCP_PORT})`);
});
