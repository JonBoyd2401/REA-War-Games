import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {once} from 'node:events';import {createHash,randomInt} from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {generateTargets,policies,createTarget,policyDescription} from './server.mjs';import {createReaTools} from './rea-tools.mjs';import {runAgent,agentSettings} from './agent.mjs';import {measureUtility,workloads} from './utility.mjs';import {assessCell,aggregate} from './assessment.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'replications/fitting-'+Date.now());
if(!run.startsWith(root+path.sep))throw Error('Run must be inside repository');
const privateRoot=path.join(root,'output','fitting-private',path.basename(run));fs.mkdirSync(privateRoot,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),save=(n,v)=>fs.writeFileSync(path.join(run,n),JSON.stringify(v,null,2)+'\n'),read=n=>JSON.parse(fs.readFileSync(path.join(run,n)));
const sources=['PLAN.md','PROMPT.md','server.mjs','predictor.mjs','fit.mjs','rea-tools.mjs','agent.mjs','utility.mjs','assessment.mjs','test.mjs','run.mjs','../agent-benchmark/server.mjs'];
const hashes=Object.fromEntries(sources.map(n=>[n,sha(fs.readFileSync(new URL(n,import.meta.url)))]));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
let targets,order;
if(fs.existsSync(run)){assert.deepEqual(read('pre-run-freeze.json').sourceSha256,hashes);if(fs.existsSync(path.join(run,'aggregate.json')))throw Error('Completed runs are immutable');targets=JSON.parse(fs.readFileSync(path.join(privateRoot,'targets.json')));order=read('schedule.json');}
else{
 fs.mkdirSync(run,{recursive:true});fs.mkdirSync(path.join(run,'cells'));save('pre-run-freeze.json',{at:new Date().toISOString(),sourceSha256:hashes,agentSettings,node:process.version,codex:execFileSync(process.env.REA_CODEX_EXECUTABLE||'codex.exe',['--version'],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore']}).trim(),rea:JSON.parse(fs.readFileSync(path.join(root,'node_modules/rea-agents/package.json'))).version});
 targets=generateTargets();fs.writeFileSync(path.join(privateRoot,'targets.json'),JSON.stringify(targets,null,2));save('target-commitment.json',{at:new Date().toISOString(),sha256:sha(fs.readFileSync(path.join(privateRoot,'targets.json')))});
 order=shuffle(targets.flatMap(t=>policies.map(policy=>({target:t.id,policy})))).map((c,i)=>({...c,cell:'cell-'+String(i+1).padStart(3,'0')}));save('schedule.json',order);
}
const prompt=fs.readFileSync(new URL('PROMPT.md',import.meta.url),'utf8');let cursor=0,completed=0;
async function worker(){while(cursor<order.length){
 const cell=order[cursor++],directory=path.join(run,'cells',cell.cell);
 if(fs.existsSync(directory)){
  for(const budget of [192])if(!fs.existsSync(path.join(directory,'checkpoint-'+budget+'.json')))fs.writeFileSync(path.join(directory,'checkpoint-'+budget+'.json'),JSON.stringify({budget,endedAt:new Date().toISOString(),outcome:{status:'interrupted'},invalidReason:'Interrupted attempt retained without rerun',predictor:null,cumulativeRequests:null,cumulativeReaOperations:null}));
  completed++;continue;
 }
 fs.mkdirSync(directory);const app=createTarget({target:targets.find(t=>t.id===cell.target),policy:cell.policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
 const tools=createReaTools({root,directory,base:'http://127.0.0.1:'+app.server.address().port,tokens:app.tokens}),startedAt=new Date().toISOString();console.log('Starting '+cell.cell+'; max three concurrent');
 try{await runAgent({cwd:path.join(privateRoot,cell.cell,'red'),privateDirectory:path.join(privateRoot,cell.cell),directory,tools,prompt:prompt+"\n\n"+policyDescription(cell.policy)});}
 finally{await tools.settle();app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 const snapshot=tools.snapshot();save('cells/'+cell.cell+'/measurement.json',{...cell,startedAt,endedAt:new Date().toISOString(),businessRequests:snapshot.businessRequests,reaOperations:snapshot.operations,serverAudit:app.audit});
 completed++;console.log('Frozen predictor for '+cell.cell+'; '+completed+'/30 complete; requests='+snapshot.businessRequests+'; REA='+snapshot.operations);
}}
await Promise.all([worker(),worker(),worker()]);
const models=order.flatMap(c=>[192].map(budget=>{const file='cells/'+c.cell+'/checkpoint-'+budget+'.json';return {...c,budget,sha256:sha(fs.readFileSync(path.join(run,file))),endedAt:read(file).endedAt};}));save('model-freezes.json',{at:new Date().toISOString(),models});
const holdouts={at:new Date().toISOString(),inputs:{},successfulObservedUnion:{}};
for(const t of targets){const seen=new Set();for(const cell of order.filter(c=>c.target===t.id)){const dir=path.join(run,'cells',cell.cell,'observations');if(fs.existsSync(dir))for(const n of fs.readdirSync(dir))for(const row of JSON.parse(fs.readFileSync(path.join(dir,n))).rows)if(row.status===200)seen.add(row.quantity);}
 holdouts.successfulObservedUnion[t.id]=[...seen].sort((a,b)=>a-b);holdouts.inputs[t.id]=shuffle(Array.from({length:1000},(_,i)=>i+1).filter(q=>!seen.has(q))).slice(0,256).sort((a,b)=>a-b);assert.equal(holdouts.inputs[t.id].length,256);
}save('holdouts.json',holdouts);fs.copyFileSync(path.join(privateRoot,'targets.json'),path.join(run,'targets.json'));
const scores=order.flatMap(c=>[192].map(budget=>assessCell(c,budget,read('cells/'+c.cell+'/checkpoint-'+budget+'.json'),targets.find(t=>t.id===c.target),holdouts.inputs[c.target])));save('scores.json',{at:new Date().toISOString(),scores});
const utility=[];for(const target of targets)for(const policy of policies)for(const w of Object.keys(workloads))utility.push(await measureUtility(target,policy,w));save('utility.json',utility);save('aggregate.json',{at:new Date().toISOString(),aggregate:aggregate(scores,utility)});
console.log('All 30 predictors frozen and scored; 120 utility journeys recorded. No score-selected reruns.');
