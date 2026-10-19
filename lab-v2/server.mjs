// Local research fixture, not a production identity service. See README for deployment gaps.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {calculateQuote} from './private-pricing.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const digest=s=>createHash('sha256').update(s).digest('hex');
export function createSessionApp({accounts,clock=Date.now,testHarness=false,sessionMs=1800000}={}){
 if(!Array.isArray(accounts)||!accounts.length)throw Error('Explicit synthetic accounts required');
 const users=new Map(accounts.map(a=>{const salt=randomBytes(16);return [a.username,{username:a.username,tenant:a.tenant,permissions:a.permissions??['read','write'],salt,passwordHash:scryptSync(a.password,salt,32)}];}));
 const sessions=new Map(),quotes=new Map(),budgets=new Map(),loginAttempts=new Map(),events=[];
 const log=(kind,user,route)=>events.push({at:new Date(clock()).toISOString(),kind,user:user?.username??null,tenant:user?.tenant??null,route});
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),route=url.pathname;
  const origin=`http://127.0.0.1:${server.address().port}`;
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
  const body=async()=>{let n=0;const chunks=[];for await(const c of req){n+=c.length;if(n>16384)throw Error('too large');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString());};
  const token=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('rea_session='))?.slice(12);
  let session=token?sessions.get(digest(token)):null;
  if(session&&session.expires<=clock()){sessions.delete(digest(token));session=null;}
  const actor=session?.user;
  try{
   if(req.method==='GET'&&route==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><title>Session protected quote research</title><h1>Session protected quotation demo</h1><label>User <input id="user" autocomplete="username"></label><label>Password <input id="pass" type="password" autocomplete="current-password"></label><button id="login">Sign in</button><button id="logout">Sign out</button><pre id="auth-state"></pre><label>Quantity <input id="quantity" type="number" value="50"></label><button id="quote">Quote</button><pre id="result"></pre>${testHarness?'<label>Other quote <input id="otherquote"></label><button id="probe">Run explicit research probes</button><button id="quota">Test five quote attempts</button><pre id="probes"></pre>':''}<script src="/assets/app.js" defer></script>${testHarness?'<script src="/test-probes.js" defer></script>':''}`);return;}
   if(req.method==='GET'&&(route==='/assets/app.js'||(testHarness&&route==='/test-probes.js'))){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8'});res.end(await readFile(path.join(root,'public',route==='/assets/app.js'?'app.js':'test-probes.js')));return;}
   if(['/assets/app.js.map','/api/debug/rules','/private-pricing.mjs'].includes(route)){json(404,{error:'not found'});return;}
   if(req.method==='POST'&&route==='/api/login'){
    if(req.headers.origin&&req.headers.origin!==origin){json(403,{error:'origin denied'});return;}
    const key=req.socket.remoteAddress;const recent=(loginAttempts.get(key)||[]).filter(t=>clock()-t<60000);if(recent.length>=8){json(429,{error:'login rate limit'});return;}recent.push(clock());loginAttempts.set(key,recent);
    let b;try{b=await body();}catch{json(400,{error:'invalid JSON'});return;}const u=users.get(b?.username);const candidate=scryptSync(typeof b?.password==='string'?b.password:'',u?.salt??Buffer.alloc(16),32);
    if(!u||!timingSafeEqual(candidate,u.passwordHash)){log('login_denied',null,route);json(401,{error:'invalid credentials'});return;}
    if(token)sessions.delete(digest(token));const sid=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');sessions.set(digest(sid),{user:u,csrf,expires:clock()+sessionMs});res.setHeader('Set-Cookie',`rea_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionMs/1000)}`);json(200,{authenticated:true,csrf});return;
   }
   if(!session){log('session_denied',null,route);json(401,{error:'authentication required'});return;}
   if(req.method==='POST'&&(req.headers.origin&&req.headers.origin!==origin||req.headers['x-csrf-token']!==session.csrf)){log('csrf_denied',actor,route);json(403,{error:'csrf denied'});return;}
   if(req.method==='POST'&&route==='/api/logout'){sessions.delete(digest(token));res.setHeader('Set-Cookie','rea_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');json(200,{signedOut:true});return;}
   if(req.method==='GET'&&route==='/api/session'){json(200,{username:actor.username,csrf:session.csrf});return;}
   if(req.method==='POST'&&route==='/api/quotes'){
    if(!actor.permissions.includes('write')){log('permission_denied',actor,route);json(403,{error:'permission denied'});return;}
    let b;try{b=await body();}catch{json(400,{error:'invalid JSON'});return;}
    if(!b||b.productId!=='widget'||!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>1000||Object.keys(b).some(k=>!['productId','quantity'].includes(k))){log('input_denied',actor,route);json(422,{error:'invalid quote input'});return;}
    const recent=(budgets.get(actor.username)||[]).filter(t=>clock()-t<60000);if(recent.length>=4){res.setHeader('Retry-After',String(Math.max(1,Math.ceil((60000-(clock()-recent[0]))/1000))));log('quota_denied',actor,route);json(429,{error:'rate limit'});return;}recent.push(clock());budgets.set(actor.username,recent);
    const quote={quoteId:randomUUID(),tenant:actor.tenant,total:calculateQuote(b.quantity).total,currency:'GBP'};quotes.set(quote.quoteId,quote);json(201,{quoteId:quote.quoteId,total:quote.total,currency:quote.currency});return;
   }
   if(req.method==='GET'&&(route.startsWith('/api/quotes/')||route==='/api/events')){
    if(!actor.permissions.includes('read')){json(403,{error:'permission denied'});return;}
    if(route==='/api/events'&&req.headers['last-event-id']){json(409,{error:'replay not supported'});return;}
    const id=route==='/api/events'?url.searchParams.get('quoteId'):route.slice('/api/quotes/'.length);const q=quotes.get(id);
    if(!q||q.tenant!==actor.tenant){log('object_denied',actor,route);json(404,{error:'not found'});return;}
    if(route==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream'});res.end(`event: quote.ready\ndata: ${JSON.stringify({quoteId:q.quoteId,status:'ready'})}\n\n`);return;}
    json(200,{quoteId:q.quoteId,total:q.total,currency:q.currency});return;
   }
   json(404,{error:'not found'});
  }catch{if(!res.headersSent)json(500,{error:'internal error'});else res.end();}
 });
 return {server,getEvents:()=>structuredClone(events)};
}
