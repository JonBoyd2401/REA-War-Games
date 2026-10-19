import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createBoundary, price} from './server.mjs';
async function fixture(t, mode='closed') {
  const app=createBoundary({world:'A',mode}); app.server.listen(0,'127.0.0.1'); await once(app.server,'listening');
  t.after(async()=>{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));});
  const base=`http://127.0.0.1:${app.server.address().port}`, token=app.createSession('A','owner');
  async function call(route,body,session=token){const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{Cookie:'boundary_session='+session,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};}
  return {app,call,token};
}
test('B01: repeated sessions and service identities share permitted request IDs',async t=>{
  const {app,call}=await fixture(t);
  for(const principal of ['user1','user2','service','user1-replacement']){
    const token=app.createSession('A',principal);
    for(const route of ['/api/quote','/api/export','/api/jobs']){
      assert.equal((await call(route,{requestId:'invented-100'},token)).status,403);
      assert.equal((await call(route,{requestId:'approved-50',quantity:100},token)).status,422);
    }
    assert.equal((await call('/api/quote',{requestId:'approved-50'},token)).body.totalCents,125000);
  }
});
test('B02: job result checks tenant and current approval, including after revocation',async t=>{
  const {app,call}=await fixture(t),job=await call('/api/jobs',{requestId:'approved-200'}),route='/api/jobs/'+job.body.jobId;
  assert.equal((await call(route)).body.quote.totalCents,300000);
  assert.equal((await call(route,undefined,app.createSession('B','other'))).status,404);
  app.revokeApproval('A','approved-200'); assert.equal((await call(route)).status,403);
});
test('B03: unknown and revoked sessions cannot read outputs',async t=>{
  const {app,call,token}=await fixture(t);
  app.revokeSession(token);
  assert.equal((await call('/api/quote',{requestId:'approved-50'})).status,401);
  assert.equal((await call('/api/quote',{requestId:'approved-50'},'forged')).status,401);
});
test('B04: simultaneous approval creation cannot enlarge the approved set',async t=>{
  const {call}=await fixture(t);
  const results=await Promise.all(Array.from({length:40},(_,i)=>call('/api/approvals',{quantity:i+75})));
  assert.ok(results.every(r=>r.status===403));
  assert.equal((await call('/api/quote',{requestId:'self-100'})).status,403);
});
test('B05: concurrent jobs retain ownership and exact legitimate results',async t=>{
  const {app,call}=await fixture(t),other=app.createSession('B','other');
  const jobs=await Promise.all(Array.from({length:20},()=>call('/api/jobs',{requestId:'approved-50'})));
  assert.equal(new Set(jobs.map(j=>j.body.jobId)).size,20);
  for(const j of jobs){assert.equal(j.status,202);assert.equal((await call('/api/jobs/'+j.body.jobId)).body.quote.totalCents,125000);assert.equal((await call('/api/jobs/'+j.body.jobId,undefined,other)).status,404);}
});
test('B06: convenience export is a real disclosure counterexample',async t=>{
  const {call}=await fixture(t,'leaky-export');
  assert.equal((await call('/api/export',{quantity:100})).body.totalCents,150000);
});
test('B07: self-approved requests reopen the quote oracle',async t=>{
  const {call}=await fixture(t,'leaky-approval');
  assert.equal((await call('/api/approvals',{quantity:100})).status,201);
  for(const route of ['/api/quote','/api/export'])assert.equal((await call(route,{requestId:'self-100'})).status,200);
});
test('B08: constructed worlds agree on allowed inputs but disagree on precisely 100 inputs',()=>{
  const different=Array.from({length:1000},(_,i)=>i+1).filter(q=>price('A',q)!==price('B',q));
  assert.deepEqual(different,Array.from({length:100},(_,i)=>i+75));
  for(const q of [50,200])assert.equal(price('A',q),price('B',q));
});
