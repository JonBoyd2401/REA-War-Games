import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {price,policies,clientSource} from './server.mjs';import {score,validate} from './predictor.mjs';import {decode} from './rea-tools.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'runs/agent-20261019');
const read=n=>JSON.parse(fs.readFileSync(path.join(run,n))),sha=b=>createHash('sha256').update(b).digest('hex'),jsonl=n=>fs.readFileSync(path.join(run,n),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const freeze=read('pre-run-freeze.json'),commit=read('target-commitment.json'),targets=read('targets.json'),order=read('schedule.json'),models=read('model-freezes.json'),held=read('holdouts.json'),scores=read('scores.json').scores;
assert.equal(freeze.rea,'6.7.0');assert.equal(freeze.agentSettings.model,'gpt-6-astra');assert.ok(Date.parse(freeze.at)<=Date.parse(commit.at));
for(const [name,digest]of Object.entries(freeze.sourceSha256))assert.equal(sha(fs.readFileSync(new URL(name,import.meta.url))),digest,name);
assert.equal(sha(fs.readFileSync(path.join(run,'targets.json'))),commit.targetsSha256);
assert.equal(targets.length,6);assert.equal(order.length,36);assert.equal(scores.length,36);assert.equal(models.models.length,36);
assert.equal(new Set(order.map(c=>c.cell)).size,36);assert.equal(new Set(order.map(c=>c.target+'|'+c.policy)).size,36);
for(const t of targets)assert.deepEqual(order.filter(c=>c.target===t.id).map(c=>c.policy).sort(),[...policies].sort());
const union=Object.fromEntries(targets.map(t=>[t.id,new Set()]));let operations=0,rowsVerified=0,bodiesVerified=0,failed=0,tokenTotal=0;const coverage={},statusCounts={},perCell=[];
for(const cell of order){
 const prefix='cells/'+cell.cell+'/',result=read(prefix+'agent-result.json'),measurement=read(prefix+'measurement.json'),target=targets.find(t=>t.id===cell.target),frozen=models.models.find(m=>m.cell===cell.cell);
 assert.ok(target);assert.equal(frozen.resultSha256,sha(fs.readFileSync(path.join(run,prefix+'agent-result.json'))));assert.equal(measurement.agentResultSha256,frozen.resultSha256);assert.ok(Date.parse(result.endedAt)<=Date.parse(models.at));assert.ok(Date.parse(models.at)<=Date.parse(held.at));
 assert.equal(measurement.target,cell.target);assert.equal(measurement.policy,cell.policy);assert.equal(measurement.predictorSha256,result.predictor?sha(JSON.stringify(result.predictor)):null);
 if(result.predictor){validate(result.predictor);assert.equal(result.outcome.status,'completed');assert.equal(result.invalidReason,null);}else failed++;
 tokenTotal+=result.tokenUsage?.totalTokens||0;
 const transcript=fs.existsSync(path.join(run,prefix+'agent-transcript.jsonl'))?jsonl(prefix+'agent-transcript.jsonl'):[];
 const start=transcript.find(r=>r.type==='start');if(result.predictor){assert.ok(start);assert.equal(start.model,'gpt-6-astra');assert.equal(start.effort,'high');assert.equal(start.environmentAccess,false);assert.equal(start.instructionSourceCount,0);assert.equal(start.sandbox.type,'readOnly');assert.equal(start.sandbox.networkAccess,false);assert.equal(start.prompt,fs.readFileSync(new URL('PROMPT.md',import.meta.url),'utf8'));}
 const commands=fs.existsSync(path.join(run,prefix+'commands.jsonl'))?jsonl(prefix+'commands.jsonl'):[];let requests=0,cellRows=0;const observed=[];
 for(const command of commands){
  assert.ok(Date.parse(commit.at)<=Date.parse(command.startedAt));assert.ok(['rea_inspect_application','rea_observe_prices'].includes(command.tool));assert.ok(transcript.some(t=>t.type==='tool_request'&&t.tool===command.tool&&JSON.stringify(t.arguments)===JSON.stringify(command.arguments)));operations++;
  const queried=command.tool==='rea_observe_prices'?command.arguments.requests:[];requests+=queried.length;
  if(command.exitCode!==0){assert.equal(result.predictor,null);continue;}
  const observation=read(prefix+'observations/'+command.key+'.json'),n=read(prefix+'rea-evidence/'+command.key+'.json').normalized_result;
  assert.ok(n.steps.every(s=>s.status==='completed'));assert.deepEqual(observation.coverage,n.completeness);coverage[n.completeness.status]=(coverage[n.completeness.status]||0)+1;
  assert.ok(transcript.some(r=>r.type==='tool_response'&&JSON.stringify(r.result)===JSON.stringify(observation)));
  const html=n.steps.at(-1).artifacts.dom.value.text,rows=[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>JSON.parse(decode(m[1])));assert.deepEqual(rows,observation.rows);assert.equal(rows.length,queried.length);
  const responses=[],scripts=[];
  for(const event of n.events.items)if(event.kind==='network-content'&&event.body.state==='captured'&&!event.body.redacted){
   const body=Buffer.from(event.body.content,'base64');assert.equal(sha(body),event.body.sha256);assert.equal(body.length,event.body.bytes);bodiesVerified++;
   if(event.phase==='response'){
    const response=n.events.items.find(e=>e.kind==='response'&&e.transaction_id===event.transaction_id),request=n.events.items.find(e=>e.kind==='network-content'&&e.phase==='request'&&e.transaction_id===event.transaction_id);
    responses.push({status:response?.status,route:response?.url?.url?new URL(response.url.url).pathname:null,method:response?.method,request:request?.body?.state==='captured'?Buffer.from(request.body.content,'base64').toString():null,body:body.toString()});
    if(response?.url?.url?.endsWith('/app.js'))scripts.push(body.toString());
   }
  }
  if(command.tool==='rea_inspect_application'){assert.equal(observation.pageHtml,html);assert.deepEqual(observation.deliveredScripts,scripts);assert.ok(scripts.includes(clientSource));}
  for(const [i,row]of rows.entries()){
   assert.equal(row.quantity,queried[i].quantity);assert.equal(row.surface,queried[i].surface);
   const request=row.surface==='approved'?{requestId:'approved-'+row.quantity}:{quantity:row.quantity};
   const index=responses.findIndex(r=>r.status===row.status&&r.route==='/api/'+row.surface&&r.method==='POST'&&r.request===JSON.stringify(request)&&r.body===JSON.stringify(row.body));assert.ok(index>=0,cell.cell+' observation '+command.key);responses.splice(index,1);rowsVerified++;cellRows++;observed.push(row);statusCounts[row.status]=(statusCounts[row.status]||0)+1;
   if(row.status===200){union[cell.target].add(row.quantity);const rounding=row.surface!=='approved'&&['rounded','rounded-approved'].includes(cell.policy)?100000:0;assert.deepEqual(row.body,{totalCents:rounding?Math.round(price(target,row.quantity)/rounding)*rounding:price(target,row.quantity),currency:'GBP',roundingCents:rounding});}
  }
 }
 assert.ok(commands.length<=12);assert.ok(requests<=24);assert.equal(measurement.reaOperations,commands.length);assert.equal(measurement.businessRequests,requests);
 if(!measurement.incompleteMeasurement){assert.equal(measurement.serverAudit.length,observed.length);for(let i=0;i<observed.length;i++){const a=measurement.serverAudit[i],o=observed[i];assert.equal(a.status,o.status);assert.equal(a.surface,o.surface);assert.deepEqual(a.body,o.body);}}
 const row=scores.find(s=>s.cell===cell.cell);assert.equal(row.validPredictor,!!result.predictor);assert.deepEqual(row.holdout,score(result.predictor,q=>price(target,q),held.inputs[cell.target]));assert.deepEqual(row.fullDomain,score(result.predictor,q=>price(target,q),Array.from({length:1000},(_,i)=>i+1)));
 perCell.push({cell:cell.cell,operations:commands.length,requests,rowsVerified:cellRows,validPredictor:!!result.predictor});
}
for(const t of targets){assert.deepEqual([...union[t.id]].sort((a,b)=>a-b),held.successfulObservedUnion[t.id]);const inputs=held.inputs[t.id];assert.equal(inputs.length,256);assert.equal(new Set(inputs).size,256);for(const q of inputs){assert.ok(Number.isInteger(q)&&q>=1&&q<=1000);assert.ok(!union[t.id].has(q));}}
const aggregate=read('aggregate.json').aggregate;assert.equal(aggregate.length,6);
for(const group of aggregate){
 assert.equal(group.targets,6);assert.equal(group.validPredictors,scores.filter(s=>s.policy===group.policy&&s.validPredictor).length);
 for(const r of group.perTarget){const s=scores.find(s=>s.target===r.target&&s.policy===group.policy),b=scores.find(s=>s.target===r.target&&s.policy==='exact'),m=read('cells/'+s.cell+'/measurement.json');for(const k of ['exact','within1','within5'])assert.equal(r[k],s.holdout[k]);assert.equal(r.reductionExactPoints,100*(b.holdout.exact-s.holdout.exact));assert.equal(r.reductionWithin5Points,100*(b.holdout.within5-s.holdout.within5));assert.equal(r.requests,m.businessRequests);assert.equal(r.reaOperations,m.reaOperations);assert.equal(r.durationSeconds,(Date.parse(m.endedAt)-Date.parse(m.startedAt))/1000);}
 for(const [k,v]of Object.entries(group.metrics)){const values=group.perTarget.map(r=>r[k]);assert.deepEqual(v,{mean:values.reduce((a,b)=>a+b,0)/6,min:Math.min(...values),max:Math.max(...values)});}
}
const utility=read('utility.json');assert.equal(utility.length,72);assert.equal(new Set(utility.map(r=>[r.target,r.policy,r.quantity].join('|'))).size,72);
for(const r of utility){const truth=price(targets.find(t=>t.id===r.target),r.quantity);assert.equal(r.status,200);assert.equal(r.truthCents,truth);assert.equal(r.errorCents,Math.abs(r.body.totalCents-truth));assert.equal(r.body.totalCents,r.policy==='rounded'?Math.round(truth/100000)*100000:truth);}
console.log(JSON.stringify({status:'PASS',cells:36,targets:6,heldoutPredictions:36*256,fullDomainDiagnosticPredictions:36000,validPredictors:36-failed,failedPredictors:failed,reaOperations:operations,reaResponseRowsVerified:rowsVerified,capturedBodiesVerified:bodiesVerified,statusCounts,coverage,normalWorkflowChecks:72,recordedTokens:tokenTotal,perCell},null,2));
