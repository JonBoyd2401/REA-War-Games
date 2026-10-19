import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {once} from 'node:events';import {spawn} from 'node:child_process';import {createHash,randomInt} from 'node:crypto';
import {createOracle,policies,price} from './server.mjs';import {learn,predict} from './learner.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const id=process.argv[2]||'reconstruction-20261019';if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Use a simple fresh run id');
const run=path.join(root,'runs',id);fs.mkdirSync(run);for(const d of ['rea-evidence','scenarios','logs','white-only','models'])fs.mkdirSync(path.join(run,d));
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>fs.writeFileSync(path.join(run,p),JSON.stringify(v,null,2));
const frozen=Object.fromEntries(['PLAN.md','learner.mjs','server.mjs','probe.mjs','run-study.mjs'].map(n=>[n,sha(fs.readFileSync(new URL(n,import.meta.url)))]));
save('pre-run-freeze.json',{at:new Date().toISOString(),sourceSha256:frozen,targets:16,budgets:[8,24,64],methods:['uniform','adaptive'],policies,holdoutsPerTarget:128});
const targets=Array.from({length:16},(_,i)=>{const a=randomInt(30,401),b=randomInt(a+50,951),r0=randomInt(2000,4001),r1=Math.round(r0*randomInt(80,96)/100),r2=Math.round(r1*randomInt(70,91)/100);return {id:'target-'+String(i+1).padStart(2,'0'),cuts:[a,b],rates:[r0,r1,r2]};});
save('white-only/targets.json',targets);
const allModels=[],trace=[];const modelRows=[];
async function live(target,policy,fn){const app=createOracle({target,policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;try{return await fn(app,base);}finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}}
async function request(base,token,quantity,route='/api/estimate',requestId){const r=await fetch(base+route,{method:'POST',headers:{Cookie:'study_session='+token,'Content-Type':'application/json'},body:JSON.stringify(requestId?{requestId}:{quantity})});return {quantity,route,status:r.status,body:await r.json()};}
const started=new Date().toISOString();
for(const target of targets){
 for(const policy of policies)for(const method of ['uniform','adaptive'])for(const budget of [8,24,64]){
  const key=`${target.id}-${policy}-${method}-${budget}`;
  const learned=await live(target,policy,(app,base)=>learn({policy,method,budget,query:(q,route,requestId)=>request(base,app.tokens[0],q,route,requestId)}));
  const file='models/'+key+'.json';save(file,learned);const record={key,target:target.id,policy,method,budget,source:'localhost HTTP',frozenAt:new Date().toISOString(),modelSha256:sha(fs.readFileSync(path.join(run,file))),file};allModels.push({...record,...learned});modelRows.push(record);
 }
 console.log(target.id+' HTTP models frozen');
}
// Real REA capture subset. All capture inputs use generated secret references.
const browser=process.env.REA_BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const cli=path.join(root,'node_modules/rea-agents/scripts/rea.mjs');
for(const target of targets.slice(0,2))for(const policy of policies){
 const key=`${target.id}-${policy}-REA-adaptive-24`;
 const learned=await live(target,policy,async(app,base)=>{
  const scenario={browser:{mode:'launch',executable_path:browser,headless:true},start_url:{url:base},actions:[{step_id:'study',action:'click',locator:{kind:'css',selector:'#run'},timeout_ms:15000},{step_id:'finished',action:'wait_for',locator:{kind:'css',selector:'#result:not(:empty)'},state:'visible',timeout_ms:45000}],secrets:[{secret_id:'studySession',environment_variable:'REA_STUDY_SESSION'}],storage:{cookies:[{name:'study_session',value:{source:'secret',secret_id:'studySession'},destination:{url:base},http_only:true,secure:false,same_site:'Strict'}]},capture:{at_end:['dom','accessibility','url'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const input=path.join(run,'scenarios',key+'.json'),output=path.join(run,'rea-evidence',key+'.json');fs.writeFileSync(input,JSON.stringify(scenario,null,2));const fd=fs.openSync(output,'wx'),ef=fs.openSync(path.join(run,'logs',key+'.stderr.txt'),'w');
  const args=[cli,'capture-browser-scenario',input,'--json'],start=new Date().toISOString();const child=spawn(process.execPath,args,{env:{...process.env,REA_STUDY_SESSION:app.tokens[0]},windowsHide:true,stdio:['ignore',fd,ef]});const [code]=await once(child,'exit');fs.closeSync(fd);fs.closeSync(ef);
  fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({key,start,end:new Date().toISOString(),args,code})+'\n');if(code!==0)throw Error(key+' REA failed');
  const raw=fs.readFileSync(output,'utf8');if(app.tokens.some(t=>raw.includes(t)))throw Error('Session token retained');
  const n=JSON.parse(raw).normalized_result;const html=n.steps.at(-1).artifacts.dom.value.text;const text=html.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1];if(!text)throw Error('Missing browser result');
  const result=JSON.parse(text.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
  trace.push({key,events:n.events.retained,completeness:n.completeness});return result;
 });
 const file='models/'+key+'.json';save(file,learned);const record={key,target:target.id,policy,method:'adaptive',budget:24,source:'REA browser capture',frozenAt:new Date().toISOString(),modelSha256:sha(fs.readFileSync(path.join(run,file))),file};allModels.push({...record,...learned});modelRows.push(record);console.log(key+' captured and frozen');
}
save('model-freezes.json',modelRows);save('rea-coverage.json',trace);
const utility=[];
for(const target of targets)for(const policy of policies){
 const rows=await live(target,policy,async(app,base)=>{
  const rows=[];for(const q of [50,200]){
   const row=await request(base,app.tokens[0],q,policy==='estimate-plus-approved-quote'?'/api/approved-quote':'/api/estimate',policy==='estimate-plus-approved-quote'?'approved-'+q:undefined);
   rows.push({...row,expectedCents:price(target,q),exact:row.body.totalCents===price(target,q)});
  }return rows;
 });utility.push({target:target.id,policy,rows});
}
save('utility.json',utility);
// Select scoring inputs only after every model is immutable on disk.
const holdouts={};for(const target of targets){const queried=new Set(allModels.filter(x=>x.target===target.id).flatMap(x=>x.rows.filter(r=>r.status===200).map(r=>r.quantity)));const available=Array.from({length:1000},(_,i)=>i+1).filter(q=>!queried.has(q));if(available.length<128)throw Error('Insufficient unseen inputs');for(let i=available.length-1;i>0;i--){const j=randomInt(i+1);[available[i],available[j]]=[available[j],available[i]];}holdouts[target.id]=available.slice(0,128);}
save('white-only/holdouts.json',{selectedAt:new Date().toISOString(),inputs:holdouts});
function median(a){const x=[...a].sort((a,b)=>a-b);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;}
const scores=[];
for(const m of allModels){
 if(sha(fs.readFileSync(path.join(run,m.file)))!==m.modelSha256)throw Error('Frozen model changed');
 const target=targets.find(t=>t.id===m.target);const errors=holdouts[m.target].map(q=>{const truth=price(target,q),guess=predict(m.model,q);return {quantity:q,truthCents:truth,predictedCents:guess,errorCents:Math.abs(guess-truth),errorPercent:100*Math.abs(guess-truth)/truth};});
 const exact=errors.filter(e=>e.errorCents===0).length,one=errors.filter(e=>e.errorPercent<=1).length,five=errors.filter(e=>e.errorPercent<=5).length;
 scores.push({key:m.key,target:m.target,policy:m.policy,method:m.method,budget:m.budget,source:m.source,requests:m.rows.length,successfulDistinct:new Set(m.rows.filter(r=>r.status===200).map(r=>r.quantity)).size,denials:m.rows.filter(r=>r.status>=400).length,exactFraction:exact/128,within1Percent:one/128,within5Percent:five/128,meanAbsoluteGBP:errors.reduce((a,e)=>a+e.errorCents/100,0)/128,medianErrorPercent:median(errors.map(e=>e.errorPercent)),errors});
}
save('scores.json',{started,finished:new Date().toISOString(),description:'Frozen programmatic models; no independent AI red-team claim',scores});
console.log(JSON.stringify({run:id,httpModels:480,reaCaptures:10,modelsScored:scores.length,holdoutsPerTarget:128}));
