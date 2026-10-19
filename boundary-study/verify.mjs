import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {price} from './server.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'runs/boundary-20261019');
const read=n=>JSON.parse(fs.readFileSync(path.join(run,n))),sha=b=>createHash('sha256').update(b).digest('hex');
for(const [name,hash]of Object.entries(read('files.json')))assert.equal(sha(fs.readFileSync(path.join(run,name))),hash);
const freeze=read('pre-run-freeze.json');assert.equal(freeze.rea,'6.7.0');
for(const [name,hash]of Object.entries(freeze.sourceSha256))assert.equal(sha(fs.readFileSync(new URL(name,import.meta.url))),hash);
const exhaustive=read('http-exhaustive.json'),utility=read('utility.json'),boundary=read('boundaries.json'),browser=read('browser-results.json'),proof=read('identifiability.json');
assert.equal(exhaustive.length,12000);const cases=new Map(exhaustive.map(r=>[[r.world,r.route,r.quantity,r.kind].join('|'),r]));assert.equal(cases.size,12000);
for(const world of ['A','B'])for(const route of ['/api/quote','/api/export','/api/jobs'])for(let q=1;q<=1000;q++)for(const kind of ['invented','extra-field']){
 const row=cases.get([world,route,q,kind].join('|'));assert.ok(row);assert.equal(row.status,kind==='invented'?403:422);assert.deepEqual(row.body,{error:kind==='invented'?'approval required':'invalid fields'});
}
assert.equal(utility.length,60);assert.equal(new Set(utility.map(r=>[r.world,r.tenant,r.principal,r.quantity,r.route].join('|'))).size,60);
for(const r of utility){assert.equal(r.result.status,200);const q=r.route==='/api/export'?r.result.body.rows[0]:r.route==='/api/jobs'?r.result.body.quote:r.result.body;assert.deepEqual(q,{requestId:'approved-'+r.quantity,quantity:r.quantity,totalCents:price(r.world,r.quantity)});assert.equal(r.response.status,r.route==='/api/jobs'?202:200);}
assert.equal(boundary.length,88);
for(const r of boundary)assert.equal(r.status,{'foreign-job':404,'forged-session':401,'revoked-approval-job':403,'revoked-session':401,'concurrent-approval':403}[r.name]);
for(const world of ['A','B'])for(const name of ['foreign-job','forged-session','revoked-approval-job','revoked-session','concurrent-approval'])assert.equal(boundary.filter(r=>r.world===world&&r.name===name).length,name==='concurrent-approval'?40:1);
assert.equal(proof.domain.length,1000);for(const [i,r]of proof.domain.entries()){assert.equal(r.quantity,i+1);assert.equal(r.worldACents,price('A',r.quantity));assert.equal(r.worldBCents,price('B',r.quantity));}
assert.deepEqual(proof.disputedInputs,Array.from({length:100},(_,i)=>i+75));assert.equal(proof.conditionalExactCeilingOnDisputed,0.5);assert.equal(proof.conditionalExactCeilingAllDomain,(900+100*.5)/1000);assert.equal(proof.attackerScore,false);
// Post-hoc arithmetic extension, separate from the prospective exact-match claim.
for(const q of proof.disputedInputs){const low=Math.min(price('A',q),price('B',q)),high=Math.max(price('A',q),price('B',q));assert.ok(low*1.05<high*.95);}
const commands=fs.readFileSync(path.join(run,'commands.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);assert.equal(commands.length,6);assert.equal(browser.length,6);
function canonical(rows){const ids=new Map();return rows.map(row=>{
 const r=structuredClone(row);
 if(r.body.jobId){ids.set(r.body.jobId,'JOB-'+ids.size);r.body.jobId=ids.get(r.body.jobId);}
 if(r.route.startsWith('/api/jobs/'))r.route='/api/jobs/'+ids.get(r.route.slice('/api/jobs/'.length));
 return r;
});}
let bodyDigests=0,matchedRows=0;const coverage=[];
for(const result of browser){
 assert.equal(new Set(browser.map(r=>r.key)).size,6);assert.equal(result.key,result.mode+'-'+result.world);
 const command=commands.find(c=>c.key===result.key);assert.equal(command.exitCode,0);assert.ok(Date.parse(freeze.at)<=Date.parse(command.startedAt));
 const n=read('rea-evidence/'+result.key+'.json').normalized_result;for(const step of n.steps)assert.equal(step.status,'completed');assert.deepEqual(n.completeness,result.completeness);coverage.push({key:result.key,status:n.completeness.status});
 const html=n.steps.at(-1).artifacts.dom.value.text,dom=JSON.parse(html.match(/<pre id="result">([\s\S]*?)<\/pre>/)[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));assert.deepEqual(dom.rows,result.rows);assert.equal(dom.error,undefined);
 const responses=[];
 for(const e of n.events.items)if(e.kind==='network-content'&&e.body.state==='captured'&&!e.body.redacted){const b=Buffer.from(e.body.content,'base64');assert.equal(sha(b),e.body.sha256);assert.equal(b.length,e.body.bytes);bodyDigests++;
  if(e.phase==='response'){const response=n.events.items.find(r=>r.kind==='response'&&r.transaction_id===e.transaction_id);const request=n.events.items.find(r=>r.kind==='network-content'&&r.phase==='request'&&r.transaction_id===e.transaction_id);responses.push({status:response?.status,url:response?.url?.url,method:response?.method,request:request?.body?.state==='captured'?Buffer.from(request.body.content,'base64').toString():null,text:b.toString()});}
 }
 assert.equal(result.rows.length,result.mode==='leaky-approval'?17:16);
 for(const row of result.rows){const i=responses.findIndex(e=>e.status===row.status&&new URL(e.url).pathname===row.route&&e.method===(row.request===null?'GET':'POST')&&e.request===(row.request===null?null:JSON.stringify(row.request))&&e.text===JSON.stringify(row.body));assert.ok(i>=0,result.key+' '+row.route);responses.splice(i,1);matchedRows++;}
 const hidden=result.rows.filter(r=>r.body.quantity===100&&Number.isInteger(r.body.totalCents));
 assert.equal(hidden.length,result.mode==='closed'?0:1);for(const r of hidden)assert.equal(r.body.totalCents,price(result.world,100));
 for(const row of result.rows){
  if(row.request?.requestId?.startsWith('invented'))assert.equal(row.status,403);
  if(row.request?.requestId&&row.request?.quantity)assert.equal(row.status,422);
  if(row.route==='/api/approvals')assert.equal(row.status,result.mode==='leaky-approval'?201:403);
  if(row.route==='/api/export'&&row.request?.quantity&&!row.request?.requestId)assert.equal(row.status,result.mode==='leaky-export'?200:422);
 }
}
assert.deepEqual(canonical(browser.find(r=>r.key==='closed-A').rows),canonical(browser.find(r=>r.key==='closed-B').rows));
console.log(JSON.stringify({status:'PASS',exhaustiveRefusals:12000,exactNormalWorkflowChecks:60,additionalBoundaryChecks:88,reaOperations:6,reaResponseRowsVerified:matchedRows,capturedBodiesVerified:bodyDigests,negativeControlDisclosures:4,closedBrowserPayloadsEquivalent:true,excludedFromEquivalence:['random job IDs','headers','timing','transport','unobserved surfaces'],conditionalProofDisputedInputs:100,postHocArithmetic:{disjointFivePercentIntervals:100,conditionalWithin5PercentCeilingOnDisputed:0.5,attackerScore:false},coverage},null,2));
