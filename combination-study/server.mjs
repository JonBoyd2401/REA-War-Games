import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {price} from '../agent-benchmark/server.mjs';
export {generateTargets,price} from '../agent-benchmark/server.mjs';

export const catalogue=[25,50,75,100,125,150,175,200,250,300,400,500,600,750,900,1000];
export const configurations={
 exact:{rounding:0,limit:null,catalogue:false,approvedOnly:false},
 limit8:{rounding:0,limit:8,catalogue:false,approvedOnly:false},
 round1000:{rounding:100000,limit:null,catalogue:false,approvedOnly:false},
 'round1000-limit8':{rounding:100000,limit:8,catalogue:false,approvedOnly:false},
 'round100-limit8':{rounding:10000,limit:8,catalogue:false,approvedOnly:false},
 'round100-catalogue16':{rounding:10000,limit:null,catalogue:true,approvedOnly:false},
 'approved-only':{rounding:0,limit:null,catalogue:false,approvedOnly:true}
};
export const policies=Object.keys(configurations);
export function delivered(value,policy,surface='estimate'){
 const step=['approved','export'].includes(surface)?0:configurations[policy].rounding;
 return step?Math.round(value/step)*step:value;
}
export const clientSource=`document.querySelector('#calculate').addEventListener('click',async()=>{
 const quantity=Number(document.querySelector('#quantity').value),surface=document.querySelector('#surface').value;
 const body=['approved','export'].includes(surface)?{requestId:'approved-'+quantity}:{quantity};
 const response=await fetch('/api/'+surface,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const record={quantity,surface,status:response.status,body:await response.json()};
 const history=document.querySelector('#history'),row=document.createElement('pre');row.dataset.index=String(history.children.length);row.textContent=JSON.stringify(record);history.appendChild(row);
});`;

export function createTarget({target,policy}){
 const c=configurations[policy];if(!c)throw Error('Unknown policy');
 const tokens=[randomBytes(32).toString('hex'),randomBytes(32).toString('hex')],seen=new Set(),audit=[];
 const capabilities=(c.approvedOnly?'General estimates unavailable.':c.catalogue?'Catalogue estimates: '+catalogue.join(', ')+'.':'General estimates available.')+' Exact approved quotes and exports exist for quantities 50 and 200.';
 const page='<!doctype html><html><head><title>Subscription quotation</title></head><body><h1>Subscription quotation</h1><p>Integer quantities 1 to 1000. GBP minor units (pence).</p><p>'+capabilities+'</p><label>Quantity <input id="quantity" type="number" value="50"></label><label>Workflow <select id="surface"><option value="estimate">Estimate</option><option value="alias">Alternate estimate</option><option value="approved">Approved quote</option><option value="export">Approved export</option></select></label><button id="calculate">Calculate</button><div id="history"></div><script src="/app.js"></script></body></html>';
 const server=http.createServer(async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));return {status,body};};
  try{
   if(req.method==='GET'&&['/','/app.js'].includes(route)){res.writeHead(200,{'Content-Type':route==='/'?'text/html':'text/javascript','Cache-Control':'no-store'});res.end(route==='/'?page:clientSource);return;}
   const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('agent_session='))?.slice(14);
   if(!tokens.includes(token))return send(401,{error:'session required'});
   const surface=route.slice(5);if(req.method!=='POST'||!['estimate','alias','approved','export'].includes(surface)||!route.startsWith('/api/'))return send(404,{error:'not found'});
   let input='';for await(const part of req){input+=part;if(input.length>2048)return send(413,{error:'too large'});}
   let body;try{body=JSON.parse(input);}catch{return send(400,{error:'invalid JSON'});}
   let quantity=body?.quantity;const respond=(status,result)=>{audit.push({surface,quantity,request:body,status,body:result});return send(status,result);};
   const approved=['approved','export'].includes(surface);
   if(approved){
    if(!body||Object.keys(body).length!==1||!['approved-50','approved-200'].includes(body.requestId))return respond(403,{error:'approved request unavailable'});
    quantity=Number(body.requestId.slice(9));
   }else{
    if(!body||Object.keys(body).length!==1||!Number.isInteger(quantity)||quantity<1||quantity>1000)return respond(422,{error:'invalid quantity'});
    if(c.approvedOnly)return respond(403,{error:'approved request required'});
    if(c.catalogue&&!catalogue.includes(quantity))return respond(403,{error:'quantity outside catalogue',allowed:catalogue});
    if(c.limit!==null&&!seen.has(quantity)&&seen.size>=c.limit)return respond(429,{error:'tenant estimate allowance exhausted'});
    seen.add(quantity);
   }
   return respond(200,{totalCents:delivered(price(target,quantity),policy,surface),currency:'GBP',roundingCents:approved?0:c.rounding});
  }catch{if(!res.headersSent)send(500,{error:'fixture failure'});else res.end();}
 });
 return {server,tokens,audit,page};
}
