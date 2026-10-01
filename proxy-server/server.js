// Adapted from the supplied Interstellar src/server.js (GPL-3.0-or-later).
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import express from 'express';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
wisp.options.allow_loopback_ips = false;
wisp.options.allow_private_ips = false;
const staticOptions = { setHeaders(res, file) {
  if (/\.(m?js)$/.test(file)) res.type('text/javascript');
  if (file.endsWith('.wasm')) res.type('application/wasm');
  res.setHeader('Service-Worker-Allowed', '/');
}};
app.get('/health', (_req, res) => res.json({ status: 'ok', engine: 'Interstellar / Ultraviolet' }));
app.use(express.static(path.join(root, 'public'), staticOptions));
app.use('/baremux/', express.static(require('@mercuryworkshop/bare-mux/node').baremuxPath, staticOptions));
app.use('/epoxy/', express.static(require('@mercuryworkshop/epoxy-transport').epoxyPath, staticOptions));
app.use('/assets/ultraviolet/', express.static(require('@titaniumnetwork-dev/ultraviolet').uvPath, staticOptions));
app.use((_req, res) => res.status(404).send('Not found'));
server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/wisp/')) { socket.destroy(); return; }
  wisp.routeRequest(req, socket, head);
});
server.listen(Number(process.env.PORT || 8080), '0.0.0.0', () => console.log('Nexus proxy ready'));
process.on('SIGTERM', () => { server.close(); setTimeout(() => process.exit(0), 1000).unref(); });
