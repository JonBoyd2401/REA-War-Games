import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {price} from './server.mjs';import {predict} from './learner.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),id=process.argv[2]||'reconstruction-20261019',run=path.join(root,'runs',id);
const read=p=>JSON.parse(fs.readFileSync(path.join(run,p),'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const freeze=read('pre-run-freeze.json'),models=read('model-freezes.json'),holdouts=read('white-only/holdouts.json'),targets=read('white-only/targets.json'),scores=read('scores.json').scores;
for(const [name,digest]of Object.entries(freeze.sourceSha256))assert.equal(sha(fs.readFileSync(path.join(root,'reconstruction',name))),digest,'pre-run implementation changed: '+name);
assert.equal(models.length,490);assert.equal(scores.length,490);assert.equal(targets.length,16);
let checks=0,bodies=0,reaRows=0;
for(const m of models){
 const bytes=fs.readFileSync(path.join(run,m.file));assert.equal(sha(bytes),m.modelSha256,m.key);assert.ok(m.frozenAt<holdouts.selectedAt);const model=JSON.parse(bytes);const score=scores.find(s=>s.key===m.key),target=targets.find(t=>t.id===m.target);
 const hidden=holdouts.inputs[m.target];assert.equal(hidden.length,128);assert.equal(new Set(hidden).size,128);
 for(const row of model.rows)if(row.status===200)assert.ok(!hidden.includes(row.quantity),'holdout was queried');
 const error=hidden.map(q=>{const truth=price(target,q),prediction=predict(model.model,q);return {quantity:q,truthCents:truth,predictedCents:prediction,errorCents:Math.abs(truth-prediction),errorPercent:100*Math.abs(truth-prediction)/truth};});
 assert.deepEqual(score.errors,error);assert.equal(score.exactFraction,error.filter(e=>e.errorCents===0).length/128);assert.equal(score.within1Percent,error.filter(e=>e.errorPercent<=1).length/128);assert.equal(score.within5Percent,error.filter(e=>e.errorPercent<=5).length/128);assert.equal(score.meanAbsoluteGBP,error.reduce((n,e)=>n+e.errorCents/100,0)/128);
 if(m.source==='REA browser capture'){
  const n=read('rea-evidence/'+m.key+'.json').normalized_result;assert.equal(n.completeness.status,'incomplete');for(const s of n.steps)assert.equal(s.status,'completed');
  const html=n.steps.at(-1).artifacts.dom.value.text;const t=html.match(/<pre id="result">([\s\S]*?)<\/pre>/)[1];assert.deepEqual(JSON.parse(t.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&')),model);
  const responses=[];
  for(const e of n.events.items)if(e.kind==='network-content'&&e.body.state==='captured'&&!e.body.redacted){const b=Buffer.from(e.body.content,'base64');assert.equal(b.length,e.body.bytes);assert.equal(sha(b),e.body.sha256);bodies++;if(e.phase==='response')responses.push({status:n.events.items.find(r=>r.kind==='response'&&r.transaction_id===e.transaction_id)?.status,text:b.toString('utf8')});}
  // Consume a matching retained response for each row; duplicate results cannot be counted twice.
  for(const row of model.rows){const i=responses.findIndex(e=>e.status===row.status&&e.text===JSON.stringify(row.body));assert.ok(i>=0,'missing response '+m.key);responses.splice(i,1);reaRows++;}
  const direct=models.find(x=>x.target===m.target&&x.policy===m.policy&&x.method===m.method&&x.budget===m.budget&&x.source==='localhost HTTP');assert.deepEqual(model,read(direct.file),'browser and HTTP learner differed');
 }
 checks++;
}
const commands=fs.readFileSync(path.join(run,'commands.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);assert.equal(commands.length,10);for(const c of commands)assert.equal(c.code,0);
const utility=read('utility.json');assert.equal(utility.length,80);for(const condition of utility)for(const row of condition.rows){assert.equal(row.status,200);if(condition.policy!=='rounded-1000')assert.equal(row.body.totalCents,row.expectedCents);}
console.log(JSON.stringify({status:'PASS',frozenModelsRescored:checks,reaOperations:commands.length,reaResponseRowsVerified:reaRows,capturedBodiesVerified:bodies,customerQuoteChecks:160,hiddenQuantitiesPerTarget:128,targets:16},null,2));
