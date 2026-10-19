// Supplemental controlled fixtures and browser-driven control probes, after the immutable baseline.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {createApp} from './research/REA_Codex_Wargame_Kit/lab/server.mjs';
const root=process.cwd(), lab=path.join(root,'research/REA_Codex_Wargame_Kit/lab');
const run=path.join(lab,'runs/laptop-20261018-supplemental');
const cli=path.join(root,'tooling/node_modules/rea-agents/scripts/rea.mjs');
const browser='C:/Program Files/Google/Chrome/Application/chrome.exe';
for(const d of ['rea-evidence','scenarios','logs'])fs.mkdirSync(path.join(run,d),{recursive:true});
const probeScript=`document.querySelector('#run').addEventListener('click',async()=>{
 const records=[];async function request(label,route,body,who='A',extra={}){const r=await fetch(route,{method:body?'POST':'GET',headers:{Authorization:'Bearer demo-'+who,...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}const row={label,status:r.status,body:data};records.push(row);return row;}
 const q=await request('legitimate-quote','/api/quotes',{productId:'widget',quantity:50});
 await request('authorised-status','/api/events?quoteId='+q.body.quoteId);
 await request('tenant-B-quote','/api/quotes/'+q.body.quoteId,null,'B');
 await request('tenant-B-event','/api/events?quoteId='+q.body.quoteId,null,'B');
 await request('replay','/api/events',null,'A',{'Last-Event-ID':'synthetic-cursor'});
 await request('debug-rules','/api/debug/rules');
 await request('price-tamper','/api/quotes',{productId:'widget',quantity:50,clientTotal:0.01});
 await request('tenant-tamper','/api/quotes',{productId:'widget',quantity:50,tenantId:'tenant-B'});
 document.querySelector('#result').textContent=JSON.stringify(records,null,2);
});`;
const conditions=[['unsafe-browser-controls','unsafe','probe'],['hardened-browser-controls','hardened','probe'],['map-removal-only','unsafe','mapless'],['server-only-frontend','unsafe','frontend'],['minimal-dto-only','unsafe','dto']];
const summary={label:'Supplemental controlled variants; not blind inference',conditions:[]};
for(const [name,mode,variant] of conditions){
 const app=createApp({mode});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const upstream=`http://127.0.0.1:${app.server.address().port}`;
 const proxy=http.createServer(async(req,res)=>{try{
  if(variant==='probe'&&req.url==='/research-probe'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Explicit synthetic control probes</title><button id="run">Run authorised probes</button><pre id="result"></pre><script src="/research-probe.js" defer></script>');return;}
  if(variant==='probe'&&req.url==='/research-probe.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(probeScript);return;}
  if(['mapless','frontend'].includes(variant)&&req.url==='/assets/app.js.map'){res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"not found"}');return;}
  if(['mapless','frontend'].includes(variant)&&req.url==='/assets/app.js'){let text=fs.readFileSync(path.join(lab,'public',variant==='frontend'?'hardened.js':'unsafe.js'),'utf8');text=text.replace(/\/\/# sourceMappingURL=.*\n?/g,'');res.writeHead(200,{'Content-Type':'text/javascript'});res.end(text);return;}
  const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);
  const headers={};for(const [k,v]of Object.entries(req.headers))if(!['host','connection','content-length','transfer-encoding'].includes(k)&&v!==undefined)headers[k]=v;
  const r=await fetch(upstream+req.url,{method:req.method,headers,...(body.length?{body}: {})});let bytes=Buffer.from(await r.arrayBuffer());
  if(variant==='dto'&&req.url.startsWith('/api/quotes')&&r.status<300){const j=JSON.parse(bytes);bytes=Buffer.from(JSON.stringify({quoteId:j.quoteId,total:j.total,currency:j.currency}));}
  const rh={};for(const [k,v]of r.headers)if(!['connection','content-length','transfer-encoding','content-encoding'].includes(k))rh[k]=v;res.writeHead(r.status,rh);res.end(bytes);
 }catch(e){res.writeHead(500);res.end(String(e));}});
 proxy.listen(0,'127.0.0.1');await once(proxy,'listening');const base=`http://127.0.0.1:${proxy.address().port}`;
 try{
  const scenario={browser:{mode:'launch',executable_path:browser,headless:true},start_url:{url:base+(variant==='probe'?'/research-probe':'/')},actions:[{step_id:'run',action:'click',locator:{kind:'css',selector:variant==='probe'?'#run':'#quote'},timeout_ms:10000},{step_id:'results',action:'wait_for',locator:{kind:'css',selector:'#result:not(:empty)'},state:'visible',timeout_ms:10000}],capture:{at_end:['dom','accessibility','url'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const input=path.join(run,'scenarios',name+'.json');fs.writeFileSync(input,JSON.stringify(scenario,null,2));const output=path.join(run,'rea-evidence',name+'.json');
  const out=fs.openSync(output,'wx');const err=fs.openSync(path.join(run,'logs',name+'.stderr.txt'),'w');const args=[cli,'capture-browser-scenario',input,'--json'];const start=new Date().toISOString();const child=spawn(process.execPath,args,{stdio:['ignore',out,err],windowsHide:true});const [code]=await once(child,'exit');fs.closeSync(out);fs.closeSync(err);
  fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({start,end:new Date().toISOString(),args,code,condition:name,upstreamMode:mode,variant})+'\n');if(code!==0)throw Error('REA capture failed '+name);
  const n=JSON.parse(fs.readFileSync(output)).normalized_result;const dom=n.steps.at(-1).artifacts.dom.value.text;const resultText=dom.match(/<pre id="result">([\s\S]*?)<\/pre>/)[1];const result=JSON.parse(resultText.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));
  const decoded=n.events.items.filter(e=>e.kind==='network-content'&&e.body.state==='captured'&&e.phase==='response').map(e=>({sequence:e.sequence,transaction:e.transaction_id,text:Buffer.from(e.body.content,'base64').toString('utf8')}));
  const script=decoded.find(e=>e.text.includes('document.getElementById')&&e.text.includes('addEventListener'));
  const row={name,mode,variant,completeness:n.completeness,events:n.events.retained,dropped:n.events.dropped,result,pricingFormulaInCapturedScript:script?.text.includes('calculateInBrowser')??null,quoteFields:variant==='probe'?null:Object.keys(result)};
  summary.conditions.push(row);console.log(JSON.stringify(row));
 }finally{proxy.closeAllConnections();await new Promise(r=>proxy.close(r));app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
}
fs.writeFileSync(path.join(run,'summary.json'),JSON.stringify(summary,null,2));
