import http from 'node:http';
import {randomBytes,randomInt} from 'node:crypto';
export const policies=['exact','limit-8','rounded','catalogue','rounded-approved','approved-only'];
export function generateTargets(){
 const targets=[];for(const family of ['volume','graduated','minimum-rebate'])for(let i=0;i<2;i++){
  const t={id:'target-'+String(targets.length+1).padStart(2,'0'),family};
  if(family==='volume')Object.assign(t,{cuts:[randomInt(80,251),randomInt(450,751)],rates:[randomInt(2000,4501),randomInt(1200,1901),randomInt(700,1101)]});
  if(family==='graduated')Object.assign(t,{cuts:[randomInt(120,301),randomInt(500,751)],rates:[randomInt(200,601),randomInt(100,181),randomInt(40,81)],fee:randomInt(20000,60001)});
  if(family==='minimum-rebate')Object.assign(t,{minimum:randomInt(50000,150001),fee:randomInt(10000,30001),rate:randomInt(300,901),cut:randomInt(300,701),rebate:randomInt(10,26)});
  targets.push(t);
 }return targets;
}
export function price(t,q){
 if(t.family==='volume')return q*t.rates[q>=t.cuts[1]?2:q>=t.cuts[0]?1:0];
 if(t.family==='graduated')return t.fee+Math.min(q,t.cuts[0])*t.rates[0]+Math.max(0,Math.min(q,t.cuts[1])-t.cuts[0])*t.rates[1]+Math.max(0,q-t.cuts[1])*t.rates[2];
 if(t.family==='minimum-rebate')return Math.round(Math.max(t.minimum,t.fee+q*t.rate)*(q>=t.cut?(100-t.rebate)/100:1));
 throw Error('Unknown target family');
}
export const clientSource=`document.querySelector('#calculate').addEventListener('click',async()=>{
 const quantity=Number(document.querySelector('#quantity').value),surface=document.querySelector('#surface').value;
 const body=surface==='approved'?{requestId:'approved-'+quantity}:{quantity};
 const r=await fetch('/api/'+surface,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const record={surface,quantity,status:r.status,body:await r.json()};
 const history=document.querySelector('#history'),row=document.createElement('pre');row.dataset.index=String(history.children.length);row.textContent=JSON.stringify(record);history.appendChild(row);
});`;
export function createTarget({target,policy}){
 if(!policies.includes(policy))throw Error('Unknown policy');
 const tokens=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex')],seen=new Set();
 const capabilities=policy==='catalogue'?'Catalogue quantities: 10, 50, 200, 1000.':policy==='approved-only'?'Only approved requests for quantities 50 and 200 are available.':policy==='rounded-approved'?'Estimates available. Exact approved requests for quantities 50 and 200 are available.':'Estimates available.';
 const page='<!doctype html><html><head><title>Subscription quotation</title></head><body><h1>Subscription quotation</h1><p>Quantities are integers 1 to 1000. Amounts are GBP cents.</p><p>'+capabilities+'</p><label>Quantity <input id="quantity" type="number" value="50"></label><label>Workflow <select id="surface"><option value="estimate">Estimate</option><option value="alias">Alternate estimate</option><option value="approved">Approved request</option></select></label><button id="calculate">Calculate</button><div id="history"></div><script src="/app.js"></script></body></html>';
 const audit=[];
 const server=http.createServer(async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));return {status,body};};
  try{
   if(req.method==='GET'&&route==='/'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(page);return;}
   if(req.method==='GET'&&route==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(clientSource);return;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('agent_session='))?.slice(14);
   if(!tokens.includes(token))return send(401,{error:'session required'});
   if(req.method!=='POST'||!['/api/estimate','/api/alias','/api/approved'].includes(route))return send(404,{error:'not found'});
   let data='';for await(const chunk of req){data+=chunk;if(data.length>2048)return send(413,{error:'too large'});}
   let b;try{b=JSON.parse(data);}catch{return send(400,{error:'invalid JSON'});}
   let quantity=b?.quantity;const record=result=>{audit.push({surface:route.slice(5),quantity,request:b,...result});return result;};
   if(route==='/api/approved'){
    if(!['rounded-approved','approved-only'].includes(policy)||!b||Object.keys(b).length!==1||!['approved-50','approved-200'].includes(b.requestId))return record(send(403,{error:'approved request unavailable'}));
    quantity=Number(b.requestId.slice(9));
   }else{
    if(!b||Object.keys(b).length!==1||!Number.isInteger(quantity)||quantity<1||quantity>1000)return record(send(422,{error:'invalid quantity'}));
    if(policy==='approved-only')return record(send(403,{error:'approved request required'}));
   }
   if(policy==='catalogue'&&![10,50,200,1000].includes(quantity))return record(send(403,{error:'quantity outside catalogue',allowed:[10,50,200,1000]}));
   if(policy==='limit-8'&&!seen.has(quantity)&&seen.size>=8)return record(send(429,{error:'tenant distinct-quantity allowance exhausted'}));
   seen.add(quantity);const exact=price(target,quantity),roundingCents=route!=='/api/approved'&&['rounded','rounded-approved'].includes(policy)?100000:0;
   return record(send(200,{totalCents:roundingCents?Math.round(exact/roundingCents)*roundingCents:exact,currency:'GBP',roundingCents}));
  }catch{if(!res.headersSent)send(500,{error:'fixture failure'});else res.end();}
 });return {server,tokens,audit,page};
}
