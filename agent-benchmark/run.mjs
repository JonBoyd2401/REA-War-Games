import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {once} from 'node:events';import {createHash,randomInt} from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {generateTargets,policies,price,createTarget} from './server.mjs';import {createReaTools} from './rea-tools.mjs';import {runAgent,agentSettings} from './agent.mjs';import {score} from './predictor.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'replications/agent-'+Date.now());
if(!run.startsWith(root+path.sep))throw Error('Run must remain within repository');
const privateRoot=path.join(root,'output','agent-private',path.basename(run));fs.mkdirSync(privateRoot,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),save=(name,value)=>fs.writeFileSync(path.join(run,name),JSON.stringify(value,null,2)+'\n'),read=name=>JSON.parse(fs.readFileSync(path.join(run,name)));
const sources=['PLAN.md','PROMPT.md','server.mjs','predictor.mjs','rea-tools.mjs','agent.mjs','test.mjs','run.mjs'];
const hashes=Object.fromEntries(sources.map(n=>[n,sha(fs.readFileSync(new URL(n,import.meta.url)))]));
function shuffle(values){for(let i=values.length-1;i>0;i--){const j=randomInt(i+1);[values[i],values[j]]=[values[j],values[i]];}return values;}
let targets,order;
if(fs.existsSync(run)){
 const freeze=read('pre-run-freeze.json');assert.deepEqual(hashes,freeze.sourceSha256);targets=JSON.parse(fs.readFileSync(path.join(privateRoot,'targets.json')));order=read('schedule.json');
 if(fs.existsSync(path.join(run,'scores.json')))throw Error('Completed runs are immutable');
}else{
 fs.mkdirSync(run,{recursive:true});fs.mkdirSync(path.join(run,'cells'));
 save('pre-run-freeze.json',{at:new Date().toISOString(),sourceSha256:hashes,agentSettings,node:process.version,codex:execFileSync(process.env.REA_CODEX_EXECUTABLE||'codex.exe',['--version'],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']}).trim(),rea:JSON.parse(fs.readFileSync(path.join(root,'node_modules/rea-agents/package.json'))).version});
 targets=generateTargets();fs.writeFileSync(path.join(privateRoot,'targets.json'),JSON.stringify(targets,null,2));
 save('target-commitment.json',{at:new Date().toISOString(),targetsSha256:sha(fs.readFileSync(path.join(privateRoot,'targets.json')))});
 order=shuffle(targets.flatMap(t=>policies.map(policy=>({target:t.id,policy})))).map((c,i)=>({...c,cell:'cell-'+String(i+1).padStart(3,'0')}));save('schedule.json',order);
}
const prompt=fs.readFileSync(new URL('PROMPT.md',import.meta.url),'utf8');let cursor=0,completed=0;
async function worker(){
 while(cursor<order.length){const cell=order[cursor++],directory=path.join(run,'cells',cell.cell),resultPath=path.join(directory,'agent-result.json');
  if(fs.existsSync(directory)){
   if(!fs.existsSync(resultPath))fs.writeFileSync(resultPath,JSON.stringify({outcome:{status:'interrupted'},invalidReason:'Pre-existing incomplete cell retained; not rerun',predictor:null,endedAt:new Date().toISOString()}));
   const measurementPath=path.join(directory,'measurement.json');
   if(!fs.existsSync(measurementPath)){
    const result=JSON.parse(fs.readFileSync(resultPath)),observations=path.join(directory,'observations');
    const found=fs.existsSync(observations)?fs.readdirSync(observations).map(n=>JSON.parse(fs.readFileSync(path.join(observations,n)))):[];
    fs.writeFileSync(measurementPath,JSON.stringify({cell:cell.cell,target:cell.target,policy:cell.policy,startedAt:result.startedAt||result.endedAt,endedAt:result.endedAt,businessRequests:found.reduce((n,o)=>n+o.rows.length,0),reaOperations:found.length,predictorSha256:result.predictor?sha(JSON.stringify(result.predictor)):null,agentResultSha256:sha(fs.readFileSync(resultPath)),serverAudit:[],incompleteMeasurement:true},null,2));
   }completed++;continue;
  }
  fs.mkdirSync(directory);const target=targets.find(t=>t.id===cell.target),app=createTarget({target,policy:cell.policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const tools=createReaTools({root,directory,base:'http://127.0.0.1:'+app.server.address().port,tokens:app.tokens});const startedAt=new Date().toISOString();
  console.log('Starting '+cell.cell+' ('+(completed+1)+'/'+order.length+'; three concurrent maximum)');
  try{
   await runAgent({cwd:path.join(privateRoot,cell.cell,'red'),directory,privateDirectory:path.join(privateRoot,cell.cell),tools,prompt});
  }catch(error){fs.writeFileSync(resultPath,JSON.stringify({outcome:{status:'failed'},invalidReason:error.message,predictor:null,endedAt:new Date().toISOString()}));}
  finally{await tools.settle();app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
  const result=JSON.parse(fs.readFileSync(resultPath));const snapshot=tools.snapshot();
  fs.writeFileSync(path.join(directory,'measurement.json'),JSON.stringify({cell:cell.cell,target:cell.target,policy:cell.policy,startedAt,endedAt:new Date().toISOString(),businessRequests:snapshot.businessRequests,reaOperations:snapshot.operations,predictorSha256:result.predictor?sha(JSON.stringify(result.predictor)):null,agentResultSha256:sha(fs.readFileSync(resultPath)),serverAudit:app.audit},null,2));
  completed++;console.log('Frozen '+cell.cell+'; '+completed+'/'+order.length+' complete; status='+result.outcome.status+'; REA='+snapshot.operations+'; requests='+snapshot.businessRequests);
 }
}
await Promise.all([worker(),worker(),worker()]);
const freezes=order.map(c=>{const resultPath=path.join(run,'cells',c.cell,'agent-result.json');return {...c,resultSha256:sha(fs.readFileSync(resultPath)),endedAt:JSON.parse(fs.readFileSync(resultPath)).endedAt};});save('model-freezes.json',{at:new Date().toISOString(),models:freezes});
// Holdouts are chosen only after all agent outputs are immutable. No score feedback
// or private target parameters are ever sent to a reconstruction agent.
const holdouts={at:new Date().toISOString(),inputs:{},successfulObservedUnion:{}};
for(const t of targets){const observed=new Set();for(const c of order.filter(c=>c.target===t.id)){
 const d=path.join(run,'cells',c.cell,'observations');if(fs.existsSync(d))for(const n of fs.readdirSync(d))for(const r of JSON.parse(fs.readFileSync(path.join(d,n))).rows)if(r.status===200)observed.add(r.quantity);
 }holdouts.successfulObservedUnion[t.id]=[...observed].sort((a,b)=>a-b);holdouts.inputs[t.id]=shuffle(Array.from({length:1000},(_,i)=>i+1).filter(q=>!observed.has(q))).slice(0,256).sort((a,b)=>a-b);assert.equal(holdouts.inputs[t.id].length,256);}
save('holdouts.json',holdouts);fs.copyFileSync(path.join(privateRoot,'targets.json'),path.join(run,'targets.json'));
const scores=[];
for(const c of order){const result=read('cells/'+c.cell+'/agent-result.json'),target=targets.find(t=>t.id===c.target);scores.push({...c,status:result.outcome.status,validPredictor:!!result.predictor,holdout:score(result.predictor,q=>price(target,q),holdouts.inputs[c.target]),fullDomain:score(result.predictor,q=>price(target,q),Array.from({length:1000},(_,i)=>i+1))});}
save('scores.json',{at:new Date().toISOString(),scope:'Agent-authored predictors; paired heldouts exclude successful observation union; full-domain includes observed inputs',scores});
const utility=[];for(const target of targets)for(const policy of policies){const app=createTarget({target,policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');try{for(const quantity of [50,200]){const surface=['rounded-approved','approved-only'].includes(policy)?'approved':'estimate';const body=surface==='approved'?{requestId:'approved-'+quantity}:{quantity};const r=await fetch('http://127.0.0.1:'+app.server.address().port+'/api/'+surface,{method:'POST',headers:{Cookie:'agent_session='+app.tokens[0],'Content-Type':'application/json'},body:JSON.stringify(body)});const output=await r.json();utility.push({target:target.id,policy,quantity,status:r.status,body:output,truthCents:price(target,quantity),errorCents:r.status===200?Math.abs(output.totalCents-price(target,quantity)):null});}}finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}}
save('utility.json',utility);
const aggregate=policies.map(policy=>{
 const cells=scores.filter(s=>s.policy===policy),perTarget=cells.map(s=>{const baseline=scores.find(b=>b.target===s.target&&b.policy==='exact');const m=read('cells/'+s.cell+'/measurement.json');return {target:s.target,family:targets.find(t=>t.id===s.target).family,cell:s.cell,validPredictor:s.validPredictor,exact:s.holdout.exact,within1:s.holdout.within1,within5:s.holdout.within5,reductionExactPoints:100*(baseline.holdout.exact-s.holdout.exact),reductionWithin5Points:100*(baseline.holdout.within5-s.holdout.within5),requests:m.businessRequests,reaOperations:m.reaOperations,durationSeconds:(Date.parse(m.endedAt)-Date.parse(m.startedAt))/1000};});
 const metrics=Object.fromEntries(['exact','within1','within5','reductionExactPoints','reductionWithin5Points','requests','reaOperations','durationSeconds'].map(k=>{const v=perTarget.map(r=>r[k]);return [k,{mean:v.reduce((a,b)=>a+b,0)/v.length,min:Math.min(...v),max:Math.max(...v)}];}));
 return {policy,targets:cells.length,validPredictors:cells.filter(c=>c.validPredictor).length,metrics,perTarget};
});save('aggregate.json',{at:new Date().toISOString(),primary:'Paired six-target means, one agent per cell; failed predictors score zero',aggregate});
console.log('All 36 predictors frozen, hidden cases scored and utility recorded. No benchmark reruns selected by score.');
