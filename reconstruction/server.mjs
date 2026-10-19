import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
export const policies=['exact','tenant-budget-8','rounded-1000','catalogue-only','estimate-plus-approved-quote'];
export function price(target,q){let i=0;while(i<target.cuts.length&&q>=target.cuts[i])i++;return q*target.rates[i];}
export function createOracle({target,policy,clock=Date.now,sessionBudget=false}){
 if(!policies.includes(policy))throw Error('Unknown policy');
 const sessions=new Map(),budgets=new Map();
 const tokens=[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')];tokens.forEach((token,i)=>sessions.set(token,{tenant:'synthetic-tenant',principal:'user-'+i}));
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');const route=url.pathname;
  const json=(s,b)=>{res.writeHead(s,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(b));};
  try{
   if(req.method==='GET'&&route==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Reconstruction research</title><button id="run">Run permitted observation study</button><pre id="result"></pre><script type="module" src="/probe.mjs"></script>');return;}
   if(req.method==='GET'&&['/learner.mjs','/probe.mjs'].includes(route)){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await readFile(new URL('.'+route,import.meta.url)));return;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('study_session='))?.slice(14);
   const user=sessions.get(token);if(!user){json(401,{error:'session required'});return;}
   if(req.method==='GET'&&route==='/api/context'){json(200,{policy,budget:24,method:'adaptive'});return;}
   if(req.method!=='POST'||!['/api/estimate','/api/quote-alias','/api/approved-quote'].includes(route)){json(404,{error:'not found'});return;}
   if(req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${server.address().port}`){json(403,{error:'origin denied'});return;}
   let data='';for await(const chunk of req){data+=chunk;if(data.length>1024){json(413,{error:'too large'});return;}}
   let b;try{b=JSON.parse(data);}catch{json(400,{error:'invalid JSON'});return;}
   let q=b?.quantity;
   if(route==='/api/approved-quote'){
    if(policy!=='estimate-plus-approved-quote'||Object.keys(b).some(k=>k!=='requestId')||!['approved-50','approved-200'].includes(b.requestId)){json(403,{error:'approved request required'});return;}
    q=b.requestId==='approved-50'?50:200;
   }else if(!b||Object.keys(b).some(k=>k!=='quantity')||!Number.isInteger(q)||q<1||q>1000){json(422,{error:'invalid inputs'});return;}
   if(policy==='catalogue-only'&&![10,50,200,1000].includes(q)){json(403,{error:'quantity outside approved catalogue'});return;}
   if(policy==='tenant-budget-8'){
    const key=(sessionBudget?token:user.tenant)+':'+Math.floor(clock()/86400000);
    const seen=budgets.get(key)||new Set();
    if(!seen.has(q)&&seen.size>=8){json(429,{error:'distinct quantity budget exhausted'});return;}
    seen.add(q);budgets.set(key,seen);
   }
   const cents=price(target,q),rounding=route!=='/api/approved-quote'&&['rounded-1000','estimate-plus-approved-quote'].includes(policy)?100000:0;
   json(200,{totalCents:rounding?Math.round(cents/rounding)*rounding:cents,currency:'GBP',roundingCents:rounding});
  }catch{if(!res.headersSent)json(500,{error:'internal error'});else res.end();}
 });return {server,tokens};
}
