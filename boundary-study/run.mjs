import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createBoundary,price} from './server.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=path.resolve(root,process.argv[2]||'replications/boundary-'+Date.now());
if(!run.startsWith(root+path.sep))throw Error('Output must stay inside repository');
fs.mkdirSync(run,{recursive:false});for(const d of ['rea-evidence','scenarios','logs'])fs.mkdirSync(path.join(run,d));
const sha=b=>createHash('sha256').update(b).digest('hex'),save=(p,v)=>fs.writeFileSync(path.join(run,p),JSON.stringify(v,null,2)+'\n');
save('pre-run-freeze.json',{at:new Date().toISOString(),design:'constructed pair; prospective boundary test, not blind reconstruction',node:process.version,rea:JSON.parse(fs.readFileSync(path.join(root,'node_modules/rea-agents/package.json'))).version,sourceSha256:Object.fromEntries(['PLAN.md','server.mjs','probe.mjs','run.mjs','test.mjs'].map(n=>[n,sha(fs.readFileSync(new URL(n,import.meta.url)))]))});
const exhaustive=[],utility=[],boundaries=[],browser=[];
async function start(world,mode='closed'){
 const app=createBoundary({world,mode});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
 const base=`http://127.0.0.1:${app.server.address().port}`;
 async function call(token,route,body){const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{Cookie:'boundary_session='+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};}
 return {app,base,call,close:async()=>{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}};
}
for(const world of ['A','B']){
 const f=await start(world);try{
  const principals=[['A','user1'],['A','user2'],['A','service'],['B','other'],['A','replacement']].map(([tenant,principal])=>({tenant,principal,token:f.app.createSession(tenant,principal)}));
  for(const p of principals)for(const quantity of [50,200])for(const route of ['/api/quote','/api/export','/api/jobs']){
   const response=await f.call(p.token,route,{requestId:'approved-'+quantity});let result=response;
   if(response.status===202)result=await f.call(p.token,'/api/jobs/'+response.body.jobId);
   const quote=route==='/api/export'?result.body.rows?.[0]:route==='/api/jobs'?result.body.quote:result.body;
   assert.equal(result.status,200);assert.equal(quote.totalCents,price(world,quantity));
   utility.push({world,tenant:p.tenant,principal:p.principal,quantity,route,response,result});
  }
  for(const route of ['/api/quote','/api/export','/api/jobs'])for(let quantity=1;quantity<=1000;quantity++)for(const kind of ['invented','extra-field']){
   const body=kind==='invented'?{requestId:'invented-'+quantity}:{requestId:'approved-50',quantity};
   const response=await f.call(principals[0].token,route,body);assert.equal(response.status,kind==='invented'?403:422);
   exhaustive.push({world,route,quantity,kind,...response});
  }
  const token=principals[0].token;
  const job=await f.call(token,'/api/jobs',{requestId:'approved-200'}),jobRoute='/api/jobs/'+job.body.jobId;
  for(const [name,result]of [['foreign-job',await f.call(principals[3].token,jobRoute)],['forged-session',await f.call('forged','/api/quote',{requestId:'approved-50'})]])boundaries.push({world,name,...result});
  f.app.revokeApproval('A','approved-200');boundaries.push({world,name:'revoked-approval-job',...await f.call(token,jobRoute)});
  f.app.revokeSession(token);boundaries.push({world,name:'revoked-session',...await f.call(token,'/api/quote',{requestId:'approved-50'})});
  const concurrent=await Promise.all(Array.from({length:40},(_,i)=>f.call(principals[1].token,'/api/approvals',{quantity:i+75})));
  for(const [i,r]of concurrent.entries())boundaries.push({world,name:'concurrent-approval',index:i,...r});
 }finally{await f.close();}console.log('Exhaustive HTTP world '+world+' complete');
}
save('http-exhaustive.json',exhaustive);save('utility.json',utility);save('boundaries.json',boundaries);
for(const mode of ['closed','leaky-export','leaky-approval'])for(const world of ['A','B']){
 const f=await start(world,mode),key=mode+'-'+world,token=f.app.createSession('A','browser');
 try{
  const scenario={browser:{mode:'launch',executable_path:process.env.REA_BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},start_url:{url:f.base},actions:[{step_id:'run',action:'click',locator:{kind:'css',selector:'#run'},timeout_ms:10000},{step_id:'done',action:'wait_for',locator:{kind:'css',selector:'#result:not(:empty)'},state:'visible',timeout_ms:20000}],secrets:[{secret_id:'boundarySession',environment_variable:'REA_BOUNDARY_SESSION'}],storage:{cookies:[{name:'boundary_session',value:{source:'secret',secret_id:'boundarySession'},destination:{url:f.base},http_only:true,secure:false,same_site:'Strict'}]},capture:{at_end:['dom','accessibility','url'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const scenarioFile=path.join(run,'scenarios',key+'.json'),outputFile=path.join(run,'rea-evidence',key+'.json');save('scenarios/'+key+'.json',scenario);
  const fd=fs.openSync(outputFile,'wx'),ef=fs.openSync(path.join(run,'logs',key+'.stderr.txt'),'wx'),startedAt=new Date().toISOString();
  const child=spawn(process.execPath,[path.join(root,'node_modules/rea-agents/scripts/rea.mjs'),'capture-browser-scenario',scenarioFile,'--json'],{env:{...process.env,REA_BOUNDARY_SESSION:token},windowsHide:true,stdio:['ignore',fd,ef]});
  const [exitCode]=await once(child,'exit');fs.closeSync(fd);fs.closeSync(ef);
  // Store portable command provenance; absolute operator paths are unnecessary.
  fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({key,startedAt,endedAt:new Date().toISOString(),exitCode,command:['node','node_modules/rea-agents/scripts/rea.mjs','capture-browser-scenario',path.relative(root,scenarioFile).replaceAll('\\','/'),'--json']})+'\n');
  assert.equal(exitCode,0);const raw=fs.readFileSync(outputFile,'utf8');assert.ok(!raw.includes(token));
  const normalized=JSON.parse(raw).normalized_result,html=normalized.steps.at(-1).artifacts.dom.value.text;
  const result=JSON.parse(html.match(/<pre id="result">([\s\S]*?)<\/pre>/)[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
  assert.equal(result.error,undefined);browser.push({key,world,mode,completeness:normalized.completeness,steps:normalized.steps.map(s=>({step_id:s.step_id,status:s.status})),...result});
 }finally{await f.close();}console.log('REA '+key+' complete');
}
save('browser-results.json',browser);
const domain=Array.from({length:1000},(_,i)=>{const quantity=i+1;return {quantity,worldACents:price('A',quantity),worldBCents:price('B',quantity)};});
save('identifiability.json',{assumptions:['only permitted payloads observed','no world-dependent side channels or prior information','worlds equally likely'],domain,disputedInputs:domain.filter(r=>r.worldACents!==r.worldBCents).map(r=>r.quantity),conditionalExactCeilingOnDisputed:0.5,conditionalExactCeilingAllDomain:0.95,attackerScore:false});
save('files.json',Object.fromEntries(['pre-run-freeze.json','http-exhaustive.json','utility.json','boundaries.json','browser-results.json','identifiability.json',...browser.map(r=>'rea-evidence/'+r.key+'.json')].map(n=>[n,sha(fs.readFileSync(path.join(run,n)))])));
console.log('Study complete. Run node boundary-study/verify.mjs '+path.relative(root,run));
