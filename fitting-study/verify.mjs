import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {price,policies,clientSource,configurations,delivered,policyDescription} from './server.mjs';import {validate} from './predictor.mjs';import {decode} from './rea-tools.mjs';import {assessCell,aggregate} from './assessment.mjs';import {workloads} from './utility.mjs';
import {numericalFit} from './fit.mjs';import {diagnose} from './diagnostics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'runs/fitting-20261019');
const read=n=>JSON.parse(fs.readFileSync(path.join(run,n))),sha=b=>createHash('sha256').update(b).digest('hex'),jsonl=n=>fs.readFileSync(path.join(run,n),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const freeze=read('pre-run-freeze.json'),commit=read('target-commitment.json'),targets=read('targets.json'),order=read('schedule.json'),models=read('model-freezes.json'),held=read('holdouts.json'),scores=read('scores.json').scores;
assert.equal(freeze.rea,'6.7.0');assert.equal(freeze.agentSettings.model,'gpt-6-astra');assert.equal(freeze.agentSettings.effort,'max');assert.ok(Date.parse(freeze.at)<=Date.parse(commit.at));
for(const [name,digest]of Object.entries(freeze.sourceSha256))assert.equal(sha(fs.readFileSync(new URL(name,import.meta.url))),digest,name);
assert.equal(sha(fs.readFileSync(path.join(run,'targets.json'))),commit.sha256);
assert.equal(targets.length,6);assert.equal(order.length,30);assert.equal(scores.length,30);assert.equal(models.models.length,30);assert.equal(new Set(order.map(c=>c.cell)).size,30);assert.equal(new Set(order.map(c=>c.target+'|'+c.policy)).size,30);
for(const t of targets)assert.deepEqual(order.filter(c=>c.target===t.id).map(c=>c.policy).sort(),[...policies].sort());
assert.ok(Date.parse(models.at)<=Date.parse(held.at));assert.ok(Date.parse(held.at)<=Date.parse(read('scores.json').at));
const union=Object.fromEntries(targets.map(t=>[t.id,new Set()]));let fittingCalls=0,operations=0,rowsVerified=0,bodiesVerified=0,failed=0,tokenTotal=0;const coverage={},statusCounts={},perCell=[];
function expected(target,policy,row,state){const c=configurations[policy],q=row.quantity,approved=['approved','export'].includes(row.surface);let status=200,body;
 const seen=state.seen,precise=state.precise;
 if(approved&&![50,200].includes(q)){status=403;body={error:'approved request unavailable'};}
 else if(!approved&&c.limit!==null&&!seen.has(q)&&seen.size>=c.limit){status=429;body={error:'tenant estimate allowance exhausted'};}
 else {if(!approved){if(c.fallback&&!seen.has(q)&&seen.size<8)precise.add(q);seen.add(q);}const ratio=approved?1:c.fallback&&!precise.has(q)?1.08:c.ratio;const truth=price(target,q);const value=ratio===1?truth:Math.round(Math.pow(ratio,Math.round(Math.log(truth)/Math.log(ratio))));body={totalCents:value,currency:'GBP',quantizationRatio:ratio,nonBindingEstimate:!approved};}
 assert.equal(row.status,status);assert.deepEqual(row.body,body);
}
for(const cell of order){
 const prefix='cells/'+cell.cell+'/',measurement=read(prefix+'measurement.json'),target=targets.find(t=>t.id===cell.target),transcript=jsonl(prefix+'agent-transcript.jsonl'),commands=fs.existsSync(path.join(run,prefix+'commands.jsonl'))?jsonl(prefix+'commands.jsonl'):[];
 assert.equal(measurement.target,cell.target);assert.equal(measurement.policy,cell.policy);const start=transcript.find(r=>r.type==='start');assert.ok(start);assert.equal(start.model,'gpt-6-astra');assert.equal(start.effort,'max');assert.equal(start.environmentAccess,false);assert.equal(start.instructionSourceCount,0);assert.equal(start.sandbox.type,'readOnly');assert.equal(start.sandbox.networkAccess,false);
 let previousEnd=-1;for(const budget of [192]){
  const result=read(prefix+'checkpoint-'+budget+'.json'),frozen=models.models.find(m=>m.cell===cell.cell&&m.budget===budget),digest=sha(fs.readFileSync(path.join(run,prefix+'checkpoint-'+budget+'.json')));assert.equal(frozen.sha256,digest);assert.ok(Date.parse(result.endedAt)<=Date.parse(models.at));
  if(result.predictor){validate(result.predictor);assert.equal(result.outcome.status,'completed');assert.equal(result.invalidReason,null);const finalMessage=transcript.filter(r=>r.type==='agent_message'&&r.phase==='final_answer').at(-1);assert.deepEqual(JSON.parse(finalMessage.text),result.predictor);const begin=transcript.findIndex(r=>r.type==='stage_start'&&r.budget===budget),end=transcript.findIndex(r=>r.type==='stage_end'&&r.budget===budget);assert.ok(begin>previousEnd);assert.ok(end>begin);assert.equal(transcript[end].checkpointSha256,digest);assert.equal(transcript[begin].prompt,fs.readFileSync(new URL('PROMPT.md',import.meta.url),'utf8')+'\n\n'+policyDescription(cell.policy));previousEnd=end;}else failed++;
  assert.ok(result.cumulativeRequests<=budget);assert.ok(result.cumulativeReaOperations<=64);const stageCommands=commands.filter(c=>Date.parse(c.startedAt)<=Date.parse(result.endedAt));assert.equal(result.cumulativeReaOperations,stageCommands.length);assert.equal(result.cumulativeRequests,stageCommands.reduce((n,c)=>n+(c.arguments.requests?.length||0),0));
  assert.deepEqual(scores.find(s=>s.cell===cell.cell&&s.budget===budget),assessCell(cell,budget,result,target,held.inputs[cell.target]));
  if(budget===192)tokenTotal+=result.tokenUsage?.totalTokens||0;
 }
 let requests=0,cellRows=0;const observed=[],seen={seen:new Set(),precise:new Set()};
 for(const command of commands){
  assert.ok(Date.parse(commit.at)<=Date.parse(command.startedAt));assert.ok(['rea_inspect_application','rea_observe_prices'].includes(command.tool));assert.ok(transcript.some(t=>t.type==='tool_request'&&t.tool===command.tool&&JSON.stringify(t.arguments)===JSON.stringify(command.arguments)));operations++;
  const scenario=read(prefix+'scenarios/'+command.key+'.json');assert.equal(new URL(scenario.start_url.url).hostname,'127.0.0.1');assert.equal(scenario.browser.headless,true);assert.equal(scenario.capture.network.header_values,false);assert.deepEqual(scenario.storage.cookies[0].value,{source:'secret',secret_id:'agentSession'});
  const queried=command.tool==='rea_observe_prices'?command.arguments.requests:[];assert.ok(queried.length<=16);requests+=queried.length;
  if(command.exitCode!==0){assert.ok([192].some(b=>!read(prefix+'checkpoint-'+b+'.json').predictor));continue;}
  const observation=read(prefix+'observations/'+command.key+'.json'),n=read(prefix+'rea-evidence/'+command.key+'.json').normalized_result;assert.ok(n.steps.every(s=>s.status==='completed'));assert.deepEqual(observation.coverage,n.completeness);coverage[n.completeness.status]=(coverage[n.completeness.status]||0)+1;
  assert.ok(transcript.some(r=>r.type==='tool_response'&&JSON.stringify(r.result)===JSON.stringify(observation)));
  const html=n.steps.at(-1).artifacts.dom.value.text,rows=[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>JSON.parse(decode(m[1])));assert.deepEqual(rows,observation.rows);assert.equal(rows.length,queried.length);const responses=[],scripts=[];
  for(const event of n.events.items)if(event.kind==='network-content'&&event.body.state==='captured'&&!event.body.redacted){const body=Buffer.from(event.body.content,'base64');assert.equal(sha(body),event.body.sha256);assert.equal(body.length,event.body.bytes);bodiesVerified++;
   if(event.phase==='response'){const response=n.events.items.find(e=>e.kind==='response'&&e.transaction_id===event.transaction_id),request=n.events.items.find(e=>e.kind==='network-content'&&e.phase==='request'&&e.transaction_id===event.transaction_id);responses.push({status:response?.status,route:response?.url?.url?new URL(response.url.url).pathname:null,method:response?.method,request:request?.body?.state==='captured'?Buffer.from(request.body.content,'base64').toString():null,body:body.toString()});if(response?.url?.url?.endsWith('/app.js'))scripts.push(body.toString());}}
  if(command.tool==='rea_inspect_application'){assert.equal(observation.pageHtml,html);assert.deepEqual(observation.deliveredScripts,scripts);assert.ok(scripts.includes(clientSource));}
  for(const [i,row]of rows.entries()){assert.equal(row.quantity,queried[i].quantity);assert.equal(row.surface,queried[i].surface);const request=['approved','export'].includes(row.surface)?{requestId:'approved-'+row.quantity}:{quantity:row.quantity};const index=responses.findIndex(r=>r.status===row.status&&r.route==='/api/'+row.surface&&r.method==='POST'&&r.request===JSON.stringify(request)&&r.body===JSON.stringify(row.body));assert.ok(index>=0,cell.cell+' '+command.key);responses.splice(index,1);rowsVerified++;cellRows++;observed.push(row);expected(target,cell.policy,row,seen);statusCounts[row.status]=(statusCounts[row.status]||0)+1;if(row.status===200)union[cell.target].add(row.quantity);}
 }
 assert.ok(commands.length<=64);assert.ok(requests<=192);assert.equal(measurement.reaOperations,commands.length);assert.equal(measurement.businessRequests,requests);assert.equal(measurement.serverAudit.length,observed.length);
 for(let i=0;i<observed.length;i++){const a=measurement.serverAudit[i],o=observed[i];assert.equal(a.status,o.status);assert.equal(a.surface,o.surface);assert.deepEqual(a.body,o.body);assert.deepEqual(a.request,['approved','export'].includes(o.surface)?{requestId:'approved-'+o.quantity}:{quantity:o.quantity});if(a.quantity!==undefined)assert.equal(a.quantity,o.quantity);}
 const fits=fs.existsSync(path.join(run,prefix+'fits.jsonl'))?jsonl(prefix+'fits.jsonl'):[];assert.ok(fits.length<=40);
 const fitRequests=transcript.filter(t=>t.type==='tool_request'&&t.tool==='fit_observations'),fitResponses=transcript.filter(t=>t.type==='tool_response'&&t.tool==='fit_observations');
 assert.equal(fits.length,fitRequests.filter((_,i)=>i<40).length);
 for(const [i,f]of fits.entries()){
  assert.equal(f.fitCall,i+1);assert.deepEqual(f.args,fitRequests[i].arguments);assert.deepEqual(f.result,fitResponses[i].result);
  const available=commands.filter(c=>Number(c.key)<=f.afterOperations).map(c=>({result:read(prefix+'observations/'+c.key+'.json')}));
  // Replay the JSON result the agent actually received (-0 serialises as 0).
  assert.ok(available.length===f.afterOperations);assert.deepEqual(f.result,JSON.parse(JSON.stringify(numericalFit(available,f.args))));
  assert.ok(commands.filter(c=>Number(c.key)<=f.afterOperations).every(c=>Date.parse(c.endedAt)<=Date.parse(f.at)));
 }
 fittingCalls+=fits.length;
 perCell.push({cell:cell.cell,operations:commands.length,requests,rowsVerified:cellRows});
}
for(const t of targets){assert.deepEqual([...union[t.id]].sort((a,b)=>a-b),held.successfulObservedUnion[t.id]);const inputs=held.inputs[t.id];assert.equal(inputs.length,256);assert.equal(new Set(inputs).size,256);for(const q of inputs){assert.ok(Number.isInteger(q)&&q>=1&&q<=1000);assert.ok(!union[t.id].has(q));}}
const utility=read('utility.json');assert.equal(utility.length,120);assert.equal(new Set(utility.map(r=>[r.target,r.policy,r.workload].join('|'))).size,120);let utilityActions=0;
for(const record of utility){const target=targets.find(t=>t.id===record.target),seen={seen:new Set(),precise:new Set()};assert.deepEqual(record.rows.filter(r=>['estimate','alias'].includes(r.surface)).map(r=>r.quantity),workloads[record.workload]);assert.equal(record.prefill.length,record.workload==='afterExhaustion'?8:0);assert.deepEqual(record.rows.slice(-4).map(r=>[r.quantity,r.surface]),[[50,'approved'],[50,'export'],[200,'approved'],[200,'export']]);for(const row of [...record.prefill,...record.rows]){expected(target,record.policy,row,seen);const truth=price(target,row.quantity);assert.equal(row.truthCents,truth);assert.equal(row.errorCents,row.status===200?Math.abs(row.body.totalCents-truth):null);assert.ok(Number.isFinite(row.elapsedMs)&&row.elapsedMs>=0);utilityActions++;}}
assert.deepEqual(read('aggregate.json').aggregate,aggregate(scores,utility));
// Recalculate reported fractions and means directly from retained prediction rows.
// This guards arithmetic independently of the scorer's aggregation implementation.
for(const record of scores)for(const metric of [record.holdout,record.fullDomain,record.deliveredOutput.score]){
 const rows=metric.errors;let exact=0,one=0,five=0,total=0;
 for(const row of rows){const error=row.predictedCents===null?null:Math.abs(row.predictedCents-row.actualCents);assert.equal(row.errorCents,error);const fraction=error===null?null:error/Math.max(1,row.actualCents);assert.equal(row.errorFraction,fraction);if(error===0)exact++;if(fraction!==null&&fraction<=.01)one++;if(fraction!==null&&fraction<=.05)five++;total+=error||0;}
 assert.equal(metric.exact,exact/rows.length);assert.equal(metric.within1,one/rows.length);assert.equal(metric.within5,five/rows.length);assert.equal(metric.meanAbsoluteGBP,record.validPredictor?total/rows.length/100:null);
}
for(const group of read('aggregate.json').aggregate){for(const [key,metric]of Object.entries(group.metrics)){const values=group.perTarget.map(r=>r[key]);assert.equal(metric.mean,values.reduce((a,b)=>a+b,0)/6);assert.equal(metric.min,Math.min(...values));assert.equal(metric.max,Math.max(...values));}
 for(const [name,summary]of Object.entries(group.utility)){const records=utility.filter(r=>r.policy===group.policy&&r.workload===name),perTarget=records.map(r=>{const estimates=r.rows.filter(x=>['estimate','alias'].includes(x.surface)),exact=r.rows.filter(x=>['approved','export'].includes(x.surface));return exact.every(x=>x.status===200&&x.errorCents===0)&&estimates.filter(x=>x.status===200).length/estimates.length>=.95&&estimates.filter(x=>x.status===200&&x.errorCents/x.truthCents<=.05).length/estimates.length>=.95;});assert.equal(summary.targetPasses,perTarget.filter(Boolean).length);assert.equal(summary.passesCriterion,perTarget.every(Boolean));}}
if(fs.existsSync(path.join(run,'diagnostics.json')))assert.deepEqual(read('diagnostics.json'),diagnose(run));
console.log(JSON.stringify({status:'PASS',cells:30,checkpoints:30,targets:6,heldoutPredictions:30*256,fullDomainDiagnosticPredictions:30000,validPredictors:30-failed,failedPredictors:failed,reaOperations:operations,reaResponseRowsVerified:rowsVerified,capturedBodiesVerified:bodiesVerified,fittingCalls,statusCounts,coverage,utilityJourneys:120,utilityActions,recordedTokensAtFinalCheckpoint:tokenTotal,perCell},null,2));
