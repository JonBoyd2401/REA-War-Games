import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';

export function price(world, quantity) {
  return quantity * (quantity >= 400 ? 1000 : quantity >= (world === 'A' ? 75 : 175) ? 1500 : 2500);
}
const page = '<!doctype html><html><head><title>Workflow boundary study</title></head><body><h1>Workflow boundary study</h1><button id="run">Run synthetic probes</button><pre id="result"></pre><script type="module" src="/probe.mjs"></script></body></html>';

// Teaching fixture: identities and approvals are provisioned by the study operator.
// No production login, durable database, TLS or distributed policy is implemented.
export function createBoundary({world, mode = 'closed'}) {
  if (!['A', 'B'].includes(world) || !['closed', 'leaky-export', 'leaky-approval'].includes(mode)) throw Error('Invalid study condition');
  const sessions = new Map(), approvals = new Map(), jobs = new Map();
  for (const tenant of ['A', 'B']) approvals.set(tenant, new Map([['approved-50', 50], ['approved-200', 200]]));
  function createSession(tenant, principal) {
    const token = randomBytes(32).toString('hex');
    sessions.set(token, {tenant, principal});
    return token;
  }
  function permittedQuote(identity, requestId) {
    const quantity = approvals.get(identity.tenant)?.get(requestId);
    return quantity === undefined ? null : {requestId, quantity, totalCents: price(world, quantity)};
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => {res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'}); res.end(JSON.stringify(body));};
    try {
      const route = new URL(req.url, 'http://localhost').pathname;
      if (route === '/' && req.method === 'GET') {res.writeHead(200, {'Content-Type':'text/html'}); res.end(page); return;}
      if (route === '/probe.mjs' && req.method === 'GET') {res.writeHead(200, {'Content-Type':'text/javascript'}); res.end(await readFile(new URL('probe.mjs', import.meta.url))); return;}
      const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('boundary_session='))?.slice(17);
      const identity = sessions.get(token);
      if (!identity) return send(401, {error:'session required'});
      if (req.method === 'GET' && route.startsWith('/api/jobs/')) {
        const job = jobs.get(route.slice('/api/jobs/'.length));
        if (!job || job.tenant !== identity.tenant) return send(404, {error:'job unavailable'});
        const quote = permittedQuote(identity, job.requestId);
        return quote ? send(200, {state:'complete', quote}) : send(403, {error:'approval required'});
      }
      if (req.method !== 'POST' || !['/api/quote','/api/export','/api/jobs','/api/approvals'].includes(route)) return send(404, {error:'route unavailable'});
      let bytes = 0; const chunks = [];
      for await (const chunk of req) {bytes += chunk.length; if(bytes > 4096) return send(413, {error:'body too large'}); chunks.push(chunk);}
      let body; try {body = JSON.parse(Buffer.concat(chunks).toString());} catch {return send(400, {error:'invalid JSON'});}
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(422, {error:'invalid fields'});
      const isQuantity = Object.keys(body).length === 1 && Number.isInteger(body.quantity) && body.quantity >= 1 && body.quantity <= 1000;
      if (route === '/api/approvals') {
        if (mode !== 'leaky-approval') return send(403, {error:'operator approval required'});
        if (!isQuantity) return send(422, {error:'invalid fields'});
        const requestId = 'self-' + body.quantity;
        approvals.get(identity.tenant).set(requestId, body.quantity);
        return send(201, {requestId});
      }
      // Deliberate negative control: a convenience export skips central permission.
      if (route === '/api/export' && mode === 'leaky-export' && isQuantity) return send(200, {quantity:body.quantity, totalCents:price(world,body.quantity)});
      if (Object.keys(body).length !== 1 || typeof body.requestId !== 'string') return send(422, {error:'invalid fields'});
      const quote = permittedQuote(identity, body.requestId);
      if (!quote) return send(403, {error:'approval required'});
      if (route === '/api/jobs') {
        const jobId = randomBytes(12).toString('hex');
        jobs.set(jobId, {tenant:identity.tenant, requestId:body.requestId});
        return send(202, {jobId});
      }
      return send(200, route === '/api/export' ? {rows:[quote]} : quote);
    } catch {if (!res.headersSent) send(500, {error:'fixture error'}); else res.end();}
  });
  return {server, createSession, revokeSession:token=>sessions.delete(token), revokeApproval:(tenant,id)=>approvals.get(tenant)?.delete(id)};
}
