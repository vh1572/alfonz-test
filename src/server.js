const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');
const { readStore, writeStore, normalizeGame } = require('./store');
const { enrichGame } = require('./enrichment');

const dataFile = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'games.json');
const publicDir = path.join(__dirname, '..', 'public');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

async function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath));
  if (!filePath.startsWith(publicDir)) return false;
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/games') {
    const data = await readStore(dataFile);
    return sendJson(res, 200, data.games.sort((a, b) => a.title.localeCompare(b.title)));
  }

  if (req.method === 'POST' && pathname === '/api/games') {
    const game = normalizeGame(await readBody(req));
    if (!game.title) return sendJson(res, 400, { error: 'Title is required.' });
    const data = await readStore(dataFile);
    data.games.push(game);
    await writeStore(dataFile, data);
    return sendJson(res, 201, game);
  }

  const match = pathname.match(/^\/api\/games\/([^/]+)(\/enrich)?$/);
  if (!match) return sendJson(res, 404, { error: 'Not found.' });

  const data = await readStore(dataFile);
  const game = data.games.find((item) => item.id === match[1]);
  if (!game) return sendJson(res, 404, { error: 'Game not found.' });

  if (req.method === 'PUT' && match[2] === '/enrich') {
    game.enrichment = await enrichGame(game);
    game.updatedAt = new Date().toISOString();
    await writeStore(dataFile, data);
    return sendJson(res, 200, game);
  }

  if (req.method === 'DELETE' && !match[2]) {
    data.games = data.games.filter((item) => item.id !== match[1]);
    await writeStore(dataFile, data);
    res.writeHead(204);
    return res.end();
  }

  return sendJson(res, 405, { error: 'Method not allowed.' });
}

async function requestListener(req, res) {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    if (await serveStatic(req, res, pathname)) return;
    return sendJson(res, 404, { error: 'Not found.' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: 'Unexpected server error.' });
  }
}

function createServer() {
  return http.createServer(requestListener);
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Board game catalog listening on http://localhost:${port}`);
  });
}

module.exports = { createServer, requestListener };
