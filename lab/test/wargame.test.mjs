import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

async function withApp(mode,run,opts={}){
  const app=createApp({mode,...opts});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const {port}=app.server.address();const base=`http://127.0.0.1:${port}`;
  try{await run({base,events:app.getSecurityEvents});}
  finally{await new Promise((res,rej)=>app.server.close(e=>e?rej(e):res()));}
}
const headers=(who='A')=>({'Authorization':`Bearer demo-${who}`});
async function quote(base,body,who='A'){
  const response=await fetch(base+'/api/quotes',{method:'POST',headers:{...headers(who),'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
}
const good={productId:'widget',quantity:50};

test('T01: unsafe client ships proprietary rules; hardened does not',async()=>{
  for(const mode of ['unsafe','hardened']) await withApp(mode,async({base})=>{
    const source=await (await fetch(base+'/assets/app.js')).text();
    assert.equal(source.includes('CORP_VOLUME_100'),mode==='unsafe');
    const map=await fetch(base+'/assets/app.js.map');
    assert.equal(map.status,mode==='unsafe'?200:404);
  });
});
test('T02: unsafe accepts client price; hardened rejects browser-calculated total',async()=>{
  await withApp('unsafe',async({base})=>{
    const r=await quote(base,{...good,clientTotal:0.01});assert.equal(r.status,201);assert.equal(r.data.total,0.01);
  });
  await withApp('hardened',async({base})=>{
    const r=await quote(base,{...good,clientTotal:0.01});assert.equal(r.status,422);
  });
});
test('T03: quote response over-disclosure is eliminated',async()=>{
  for(const mode of ['unsafe','hardened']) await withApp(mode,async({base})=>{
    const r=await quote(base,good);assert.equal(r.status,201);
    assert.equal(Object.hasOwn(r.data,'discountBands'),mode==='unsafe');
    assert.equal(Object.hasOwn(r.data,'ruleId'),mode==='unsafe');
  });
});
test('T04: one tenant cannot retrieve another tenant’s quote after hardening',async()=>{
  for(const mode of ['unsafe','hardened']) await withApp(mode,async({base})=>{
    const created=await quote(base,good,'A');
    const reply=await fetch(base+'/api/quotes/'+created.data.quoteId,{headers:headers('B')});
    assert.equal(reply.status,mode==='unsafe'?200:404);
  });
});
test('T05: SSE streams disclose decision metadata in unsafe mode only',async()=>{
  for(const mode of ['unsafe','hardened']) await withApp(mode,async({base})=>{
    await quote(base,good);
    const response=await fetch(base+'/api/events',{headers:headers()});
    const stream=await response.text();
    assert.equal(stream.includes('discount.evaluated'),mode==='unsafe');
    assert.equal(stream.includes('threshold'),mode==='unsafe');
    assert.equal(stream.includes('quote.ready'),mode==='hardened');
  });
});
test('T06: SSE cross-tenant and replay isolation',async()=>{
  await withApp('hardened',async({base})=>{
    const created=await quote(base,good,'A');
    const wrong=await fetch(base+'/api/events?quoteId='+created.data.quoteId,{headers:headers('B')});
    assert.equal(wrong.status,404);
    const replay=await fetch(base+'/api/events',{headers:{...headers('A'),'Last-Event-ID':'unauthorised-cursor'}});
    assert.equal(replay.status,409);
  });
});
test('T07: hardened mode limits automated quote-oracle sampling',async()=>{
  await withApp('hardened',async({base,events})=>{
    const statuses=[];
    for(let i=0;i<5;i++) statuses.push((await quote(base,good)).status);
    assert.deepEqual(statuses,[201,201,201,201,429]);
    assert.equal(events().some(e=>e.kind==='quote_budget_exceeded'),true);
  });
});
test('T08: debugging rule endpoint not exposed after hardening',async()=>{
  for(const mode of ['unsafe','hardened']) await withApp(mode,async({base})=>{
    const res=await fetch(base+'/api/debug/rules',{headers:headers()});
    assert.equal(res.status,mode==='unsafe'?200:404);
  });
});
test('T09: hardened mode ignores client tenant assertion by rejecting it',async()=>{
  await withApp('hardened',async({base,events})=>{
    const res=await quote(base,{...good,tenantId:'tenant-B'});
    assert.equal(res.status,422);
    assert.equal(events().some(e=>e.kind==='untrusted_client_field'),true);
  });
});
