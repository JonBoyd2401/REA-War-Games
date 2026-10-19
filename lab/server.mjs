import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { calculateQuote, INTERNAL_PRICING_RULES } from './private-pricing.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const demoAccounts = Object.freeze({
  'demo-A': { user: 'alice', tenant: 'tenant-A', permissions: ['quotes:read','quotes:write'] },
  'demo-B': { user: 'bob', tenant: 'tenant-B', permissions: ['quotes:read','quotes:write'] },
});
const JSON_HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};

function json(res, status, body) {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(body));
}
function identity(req) {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
  return demoAccounts[token] ?? null;
}
async function jsonBody(req) {
  const chunks=[];
  for await (const c of req) {
    chunks.push(c);
    if (chunks.reduce((sum,x)=>sum+x.length,0)>16384) throw Error('Body too large');
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function getPath(req) { return new URL(req.url, 'http://localhost'); }
function hardenedHeaders(res) {
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'");
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
}
/** Synthetic exercise server only. Hard-coded demo bearer strings are NOT a production auth design. */
export function createApp({ mode='hardened', clock=()=>Date.now(), maxQuotesPerMinute=4 }={}) {
  if (!['unsafe','hardened'].includes(mode)) throw Error('mode must be unsafe or hardened');
  const quotes=new Map();
  const calls=new Map();
  const securityEvents=[];
  const hardened=mode==='hardened';
  const record=(kind,actor,route)=>{
    const event={time:new Date(clock()).toISOString(),kind,user:actor?.user??null,tenant:actor?.tenant??null,route};
    securityEvents.push(event);
    // Structured metadata only: no tokens, request bodies or quote values.
    if (process.env.LOG_WARGAME_EVENTS==='1') console.log(JSON.stringify(event));
  };
  const server=http.createServer(async(req,res)=>{
    try {
      if (hardened) hardenedHeaders(res);
      const url=getPath(req), path=url.pathname;
      if(req.method==='GET' && path==='/') {
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
        res.end(`<!doctype html><html><head><title>${mode} REA war game</title></head><body><h1>${mode} quotation demo</h1><label>Quantity <input id="quantity" type="number" min="1" value="50"></label><button id="quote">Quote</button><pre id="result"></pre><script src="/assets/app.js" defer></script></body></html>`);
        return;
      }
      if(req.method==='GET' && path==='/assets/app.js') {
        const source=await readFile(join(root,'public',hardened?'hardened.js':'unsafe.js'));
        res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(source);return;
      }
      if(req.method==='GET' && path==='/assets/app.js.map') {
        if(hardened) {json(res,404,{error:'not found'});return;}
        const source=await readFile(join(root,'public','unsafe.js.map'));
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});res.end(source);return;
      }
      const actor=identity(req);
      if(!actor) {record('auth_denied',null,path);json(res,401,{error:'unauthorised'});return;}
      if(req.method==='GET' && path==='/api/debug/rules') {
        if(hardened) {record('debug_route_denied',actor,path);json(res,404,{error:'not found'});return;}
        json(res,200,INTERNAL_PRICING_RULES);return;
      }
      if(req.method==='POST' && path==='/api/quotes') {
        if(hardened){
          const now=clock();const recent=(calls.get(actor.user)||[]).filter(x=>now-x<60_000);
          if(recent.length>=maxQuotesPerMinute){record('quote_budget_exceeded',actor,path);json(res,429,{error:'rate limit'});return;}
          recent.push(now);calls.set(actor.user,recent);
        }
        let body;
        try{body=await jsonBody(req);}catch{record('invalid_json',actor,path);json(res,400,{error:'invalid JSON'});return;}
        if(!body || body.productId!=='widget' || !Number.isInteger(body.quantity) || body.quantity<1 || body.quantity>1000){
          record('invalid_quote',actor,path);json(res,422,{error:'invalid quote'});return;
        }
        if(hardened && Object.keys(body).some(x=>!['productId','quantity'].includes(x))){
          record('untrusted_client_field',actor,path);json(res,422,{error:'unexpected field'});return;
        }
        const pricing=calculateQuote(body.quantity);
        const total=!hardened && typeof body.clientTotal==='number' ? body.clientTotal : pricing.total;
        const tenant=!hardened && typeof body.tenantId==='string' ? body.tenantId : actor.tenant;
        const quote={quoteId:randomUUID(),tenant,productId:'widget',quantity:body.quantity,total,currency:'GBP',ruleId:pricing.ruleId,threshold:pricing.threshold};
        quotes.set(quote.quoteId,quote);
        if(hardened) {json(res,201,{quoteId:quote.quoteId,total:quote.total,currency:'GBP'});return;}
        json(res,201,{...quote,discountBands:INTERNAL_PRICING_RULES.volumeBands});return;
      }
      if(req.method==='GET' && path.startsWith('/api/quotes/')) {
        const quote=quotes.get(path.slice('/api/quotes/'.length));
        if(!quote){json(res,404,{error:'not found'});return;}
        if(hardened && quote.tenant!==actor.tenant){record('tenant_boundary_denied',actor,path);json(res,404,{error:'not found'});return;}
        json(res,200,hardened?{quoteId:quote.quoteId,total:quote.total,currency:quote.currency}:{...quote});return;
      }
      if(req.method==='GET' && path==='/api/events') {
        if(hardened && req.headers['last-event-id']) {record('replay_denied',actor,path);json(res,409,{error:'replay not supported'});return;}
        const wanted=url.searchParams.get('quoteId');
        const quote=wanted?quotes.get(wanted):Array.from(quotes.values()).reverse().find(q=>hardened?q.tenant===actor.tenant:true);
        if(hardened && quote && quote.tenant!==actor.tenant){record('event_boundary_denied',actor,path);json(res,404,{error:'not found'});return;}
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'});
        if(hardened){res.end(`event: quote.ready\ndata: ${JSON.stringify({quoteId:quote?.quoteId??null,status:quote?'ready':'none'})}\n\n`);return;}
        res.end(`event: discount.evaluated\ndata: ${JSON.stringify({quoteId:quote?.quoteId??null,tenantId:quote?.tenant??null,ruleId:quote?.ruleId??null,threshold:quote?.threshold??null})}\n\n`);return;
      }
      json(res,404,{error:'not found'});
    } catch (e) {json(res,500,{error:'internal error'});}
  });
  return {server,getSecurityEvents:()=>structuredClone(securityEvents)};
}

if (process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const mode=process.env.MODE||'hardened';
  const port=Number(process.env.PORT||(mode==='hardened'?'3001':'3000'));
  createApp({mode}).server.listen(port,'127.0.0.1',()=>console.log(`REA lab ${mode} http://127.0.0.1:${port}`));
}
