// White-team supplemental HTTP measurements. These are NOT REA captures or blind inference.
import fs from 'node:fs';
import {once} from 'node:events';
import {createApp} from './research/REA_Codex_Wargame_Kit/lab/server.mjs';
const run='research/REA_Codex_Wargame_Kit/lab/runs/laptop-20261018-01';
const report={label:'supplemental-white-team-http',started:new Date().toISOString(),policy:{quantities:[1,25,75,150],successfulSampleBudget:4,blind:false},modes:{}};
for(const mode of ['unsafe','hardened']){
 const data=report.modes[mode]={};
 async function fixture(fn){const app=createApp({mode});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;
  async function req(label,route,{body,who='A',extra={}}={}){const start=new Date().toISOString();const t=performance.now();const response=await fetch(base+route,{method:body?'POST':'GET',headers:{Authorization:`Bearer demo-${who}`,...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const text=await response.text();let parsed;try{parsed=JSON.parse(text);}catch{parsed=text;}const row={label,start,method:body?'POST':'GET',route,actor:who,request:body??null,status:response.status,body:parsed,elapsedMs:performance.now()-t};return row;}
  try{await fn(req,app);}finally{await new Promise(r=>app.server.close(r));}}
 await fixture(async(req)=>{data.samples=[];for(const quantity of report.policy.quantities)data.samples.push(await req('ordinary-sample','/api/quotes',{body:{productId:'widget',quantity}}));if(mode==='hardened')data.fifth=await req('quota-enforcement-check','/api/quotes',{body:{productId:'widget',quantity:150}});});
 await fixture(async(req,app)=>{
  data.controls=[];const q=await req('legitimate-quote','/api/quotes',{body:{productId:'widget',quantity:50}});data.controls.push(q);
  for(const [label,route,opts] of [
   ['tenant-B-reads-A-quote','/api/quotes/'+q.body.quoteId,{who:'B'}],
   ['authorised-status','/api/events?quoteId='+q.body.quoteId,{}],
   ['tenant-B-reads-A-events','/api/events?quoteId='+q.body.quoteId,{who:'B'}],
   ['unsupported-replay','/api/events',{extra:{'Last-Event-ID':'synthetic-cursor'}}],
   ['debug-route','/api/debug/rules',{}],
   ['source-map','/assets/app.js.map',{}],
   ['price-tamper','/api/quotes',{body:{productId:'widget',quantity:50,clientTotal:0.01}}],
   ['tenant-tamper','/api/quotes',{body:{productId:'widget',quantity:50,tenantId:'tenant-B'}}]
  ]) data.controls.push(await req(label,route,opts));
  data.monitoring=app.getSecurityEvents();
 });
}
report.finished=new Date().toISOString();fs.writeFileSync(run+'/white_only/api-controls.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
