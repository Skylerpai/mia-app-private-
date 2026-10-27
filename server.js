import http from 'node:http';
import crypto from 'node:crypto';

const port = Number(process.env.PORT || 3000);
const user = process.env.APP_USER || 'owner';
const passHash = process.env.APP_PASSWORD_SHA256 || '';
const sessions = new Map();
const data = { messages: [], memories: [] };

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const read = (req) => new Promise((resolve, reject) => {
  let text = '';
  req.on('data', (chunk) => { text += chunk; });
  req.on('end', () => {
    try { resolve(text ? JSON.parse(text) : {}); }
    catch (error) { reject(error); }
  });
  req.on('error', reject);
});

const token = () => crypto.randomBytes(32).toString('hex');
const auth = (req) => {
  const value = req.headers.authorization?.replace(/^Bearer /, '') || '';
  return value && sessions.has(value);
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
    if (req.method === 'POST' && req.url === '/auth/login') {
      const body = await read(req);
      const hash = crypto.createHash('sha256').update(String(body.password || '')).digest('hex');
      if (body.username !== user || hash !== passHash) return json(res, 401, { error: 'invalid credentials' });
      const session = token();
      sessions.set(session, Date.now());
      return json(res, 200, { token: session });
    }
    if (!auth(req)) return json(res, 401, { error: 'authentication required' });
    if (req.method === 'GET' && req.url === '/api/state') return json(res, 200, data);
    if (req.method === 'POST' && req.url === '/api/messages') {
      const body = await read(req);
      data.messages.push({ ...body, createdAt: new Date().toISOString() });
      return json(res, 201, { ok: true });
    }
    if (req.method === 'POST' && req.url === '/api/memories') {
      const body = await read(req);
      data.memories.push({ ...body, createdAt: new Date().toISOString() });
      return json(res, 201, { ok: true });
    }
    return json(res, 404, { error: 'not found' });
  } catch (error) {
    return json(res, 400, { error: 'bad request' });
  }
});

server.listen(port, () => console.log(`Mia backend listening on ${port}`));
