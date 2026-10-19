import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {generateTargets as generate,price} from '../agent-benchmark/server.mjs';
export {price};
export const policies=['selector-leak','bound-context','export-leak','shared-rule'];
export function generateTargets(){const own=generate(),other=generate();return other.map((t,i)=>({id:t.id,own:own[i],other:t}));}
export function truth(target,policy,context,q){return price(context==='other'||policy==='shared-rule'?target.other:target.own,q);}
export const clientSource=`document.querySelector('#calculate').addEventListener('click',async()=>{
 const request=JSON.parse(document.querySelector('#request').value);
 const r=await fetch('/api/workflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
 const history=document.querySelector('#history'),row=document.createElement('pre');row.dataset.index=String(history.children.length);row.textContent=JSON.stringify({request,status:r.status,body:await r.json()});history.appendChild(row);
});`;
export const page='<!doctype html><html><head><title>Exact quote workspace</title></head><body><h1>Exact quote workspace</h1><p>Two business contexts: own and other. All amounts are exact GBP pence. Integer quantities 1..1000. Create, revise, accept, export and background export are available. The signed-in customer owns context own. A known other-context object is other-seed and job other-job.</p><label>Workflow JSON<textarea id="request">{"op":"create","context":"own","quantity":50}</textarea></label><button id="calculate">Run workflow</button><div id="history"></div><script src="/app.js"></script></body></html>';
export function policyDescription(policy){return 'Policy: '+policy+'. No rounding or application query cap. '+({
 'selector-leak':'Contexts have independently provisioned pricing parameters. The server mistakenly trusts the requested context for all quote and object operations.',
 'bound-context':'Contexts have independently provisioned pricing parameters. The server binds all quote, revision, acceptance, export and job operations to the authenticated context. No other-context credential or self-service entitlement is available.',
 'export-leak':'Contexts have independently provisioned pricing parameters. Quote and object operations enforce context permissions, but the convenience export accepts arbitrary context and quantity without that check. Test this advertised negative control.',
 'shared-rule':'All quote, export and job operations enforce context permissions, but BOTH contexts intentionally use the identical pricing function. This is a negative control: transfer your own-context reconstruction to other.'
 }[policy]);}
// In-memory teaching fixture. IDs are deliberately guessable: permission must not depend on secrecy of IDs.
export function createEngine({target,policy}){
 if(!policies.includes(policy))throw Error('Unknown policy');
 const quotes=new Map(),jobs=new Map(),revoked=new Set();let next=0;
 const quote=(id,context,q)=>({quoteId:id,context,quantity:q,totalCents:truth(target,policy,context,q),currency:'GBP',version:1,state:'draft'});
 quotes.set('other-seed',quote('other-seed','other',333));jobs.set('other-job',{jobId:'other-job',context:'other',quote:{...quotes.get('other-seed')}});
 const permitted=(identity,context)=>!revoked.has(identity)&&(policy==='selector-leak'||identity===context);
 function execute(identity,b){
  const out=(status,body)=>({status,body:structuredClone(body)}),bad=()=>out(422,{error:'invalid fields'}),denied=()=>out(403,{error:'context unavailable'});
  if(!identity||revoked.has(identity))return out(401,{error:'session unavailable'});
  if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.op!=='string')return bad();
  const keys=(...names)=>Object.keys(b).length===names.length&&names.every(k=>Object.hasOwn(b,k));
  const quantity=q=>Number.isInteger(q)&&q>=1&&q<=1000,context=c=>['own','other'].includes(c);
  if(b.op==='create'||b.op==='alias'){
   if(!keys('op','context','quantity')||!quantity(b.quantity)||!context(b.context))return bad();
   if(!permitted(identity,b.context))return denied();
   const item=quote('quote-'+(++next),b.context,b.quantity);quotes.set(item.quoteId,item);return out(200,item);
  }
  if(b.op==='export'&&keys('op','context','quantity')){
   if(!context(b.context)||!quantity(b.quantity))return bad();
   if(!['selector-leak','export-leak'].includes(policy))return denied();
   return out(200,{context:b.context,quantity:b.quantity,totalCents:truth(target,policy,b.context,b.quantity),currency:'GBP',format:'convenience-export'});
  }
  if(b.op==='job-read'){
   if(!keys('op','jobId')||typeof b.jobId!=='string')return bad();
   const job=jobs.get(b.jobId);if(!job||!permitted(identity,job.context))return denied();
   return out(200,{jobId:job.jobId,state:'complete',quote:job.quote});
  }
  const fields=b.op==='revise'?['op','quoteId','quantity','version']:b.op==='accept'?['op','quoteId','version']:['op','quoteId'];
  if(!['get','revise','accept','export','job-create'].includes(b.op)||!keys(...fields)||typeof b.quoteId!=='string')return bad();
  const item=quotes.get(b.quoteId);if(!item||!permitted(identity,item.context))return denied();
  if(['revise','accept'].includes(b.op)){
   if(!Number.isInteger(b.version)||(b.op==='revise'&&!quantity(b.quantity)))return bad();
   if(item.version!==b.version||item.state!=='draft')return out(409,{error:'quote version or state conflict'});
   if(b.op==='revise'){item.quantity=b.quantity;item.totalCents=truth(target,policy,item.context,b.quantity);item.version++;}else item.state='accepted';
  }
  if(b.op==='job-create'){const jobId='job-'+(++next),job={jobId,context:item.context,quote:structuredClone(item)};jobs.set(jobId,job);return out(200,{jobId,state:'queued'});}
  return out(200,item);
 }
 return {execute,revoke:identity=>revoked.add(identity)};
}
export function createTarget(options){
 const engine=createEngine(options),tokens=Array.from({length:3},()=>randomBytes(32).toString('hex')),audit=[];
 const server=http.createServer(async(req,res)=>{
  const send=r=>{res.writeHead(r.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(r.body));};
  try{
   const route=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET'&&['/','/app.js'].includes(route)){res.writeHead(200,{'Content-Type':route==='/'?'text/html':'text/javascript','Cache-Control':'no-store'});res.end(route==='/'?page:clientSource);return;}
   if(req.method!=='POST'||route!=='/api/workflow')return send({status:404,body:{error:'route unavailable'}});
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('agent_session='))?.slice(14),index=tokens.indexOf(token),identity=index<0?null:index===2?'other':'own';
   let data='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)return send({status:413,body:{error:'too large'}});data+=chunk;}
   let request;try{request=JSON.parse(data);}catch{return send({status:400,body:{error:'invalid JSON'}});}
   const result=engine.execute(identity,request);audit.push({identity,request,...result});send(result);
  }catch{if(!res.headersSent)send({status:500,body:{error:'fixture failure'}});else res.end();}
 });
 return {server,tokens,audit,revoke:engine.revoke};
}
