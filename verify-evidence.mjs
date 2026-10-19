import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const base=decodeURIComponent(root);
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const checks=[];let bodies=0,commands=0,scenarios=0;
function check(label,fn){fn();checks.push(label);}
const runs=['laptop-20261018-01','laptop-20261018-supplemental','validation-20261018','session-boundaries-20261018'];
const expected=[18,11,18,9];
for(let i=0;i<runs.length;i++){
 const rows=fs.readFileSync(path.join(base,'runs',runs[i],'commands.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
 check(`${runs[i]}: ${expected[i]} successful recorded REA operations`,()=>{assert.equal(rows.length,expected[i]);for(const r of rows)assert.equal(r.code,0);});commands+=rows.length;
 for(const f of fs.readdirSync(path.join(base,'runs',runs[i],'rea-evidence')).filter(f=>f.endsWith('.json'))){
  const n=read(`runs/${runs[i]}/rea-evidence/${f}`).normalized_result;
  if(!n?.steps||!n?.events?.items)continue;
  scenarios++;assert.equal(n.completeness.status,'incomplete');for(const s of n.steps)assert.equal(s.status,'completed',`${f} step`);
  for(const e of n.events.items)if(e.kind==='network-content'&&e.body.state==='captured'&&!e.body.redacted){const bytes=Buffer.from(e.body.content,'base64');assert.equal(bytes.length,e.body.bytes,f);assert.equal(sha(bytes),e.body.sha256,f);bodies++;}
 }
}
function capture(run,name){return read(`runs/${run}/rea-evidence/${name}.json`).normalized_result;}
function dom(n,id='result'){
 const h=n.steps.at(-1).artifacts.dom.value.text;
 const s=h.match(new RegExp('<pre id="'+id+'">([\\s\\S]*?)<\\/pre>'))?.[1];assert.ok(s,`missing ${id}`);
 const t=s.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');try{return JSON.parse(t);}catch{return t;}
}
function responseRecords(n){return n.events.items.filter(e=>e.kind==='network-content'&&e.phase==='response'&&e.body.state==='captured').map(e=>({text:Buffer.from(e.body.content,'base64').toString('utf8'),status:n.events.items.find(r=>r.kind==='response'&&r.transaction_id===e.transaction_id)?.status}));}
function linked(n,row){assert.ok(responseRecords(n).some(e=>e.status===row.status&&e.text===(typeof row.body==='string'?row.body:JSON.stringify(row.body))),`DOM result lacks matching network response ${row.status}`);}
for(const mode of ['unsafe','hardened'])check(`${mode}: baseline disclosure and legitimate quote`,()=>{
 const run=runs[0],n=capture(run,mode+'-scenario'),i=capture(run,mode+'-inspect');
 const src=i.scripts.items.map(s=>s.source.artifact.text).join('\n');assert.equal(src.includes('calculateInBrowser')&&src.includes('baseUnitPrice'),mode==='unsafe');
 const q=responseRecords(n).find(x=>x.status===201&&x.text.includes('quoteId'));assert.ok(q);const j=JSON.parse(q.text);assert.equal(j.total,1104);assert.equal(Object.keys(j).length,mode==='unsafe'?9:3);assert.equal(Buffer.byteLength(q.text),mode==='unsafe'?370:80);
 assert.equal(i.scripts.items.reduce((sum,s)=>sum+s.source.artifact.bytes,0),mode==='unsafe'?1147:537);
});
for(const mode of ['unsafe','hardened'])for(const suffix of ['','-r2','-r3'])check(`${mode}${suffix}: tenant/mutation denials and normal flow`,()=>{
 const n=capture(runs[1],mode+'-browser-controls'+suffix),rows=dom(n);assert.deepEqual(rows.map(r=>r.status),mode==='unsafe'?[201,200,200,200,200,200,201,201]:[201,200,404,404,409,404,422,422]);assert.equal(rows[0].body.total,1104);for(const r of rows)linked(n,r);
});
for(const [name,formula,fields] of [['map-removal-only',true,9],['server-only-frontend',false,9],['minimal-dto-only',true,3]])check(`${name}: partial protection limitation`,()=>{
 const n=capture(runs[1],name),j=dom(n);assert.equal(Object.keys(j).length,fields);assert.equal(j.total,1104);linked(n,{status:201,body:j});assert.equal(responseRecords(n).some(e=>e.text.includes('const calculateInBrowser =')&&e.text.includes('baseUnitPrice')),formula);
});
for(const mode of ['unsafe','hardened'])check(`${mode}: quota comparison`,()=>{const n=capture(runs[1],mode+'-browser-quota'),r=dom(n);assert.deepEqual(r.map(x=>x.status),mode==='unsafe'?[201,201,201,201,201]:[201,201,201,201,429]);for(const x of r)linked(n,x);});
for(const name of ['anonymous','forged-cookie','revoked-cookie','wrong-password','logged-out'])check(`${name}: protected probes rejected`,()=>{
 const n=capture(runs[3],name),r=dom(n,'probes');assert.deepEqual(r.map(x=>x.status),[401,401,401,401,401,401,404,404]);for(const x of r)linked(n,x);if(name==='wrong-password')assert.equal(dom(n,'auth-state'),401);if(name==='logged-out')assert.equal(dom(n,'auth-state'),'signed out 200');
});
check('tenant-B: isolation, authority, CSRF and useful own quote',()=>{const n=capture(runs[3],'tenant-B'),r=dom(n,'probes');assert.deepEqual(r.map(x=>x.status),[404,404,422,422,403,404,404,404]);for(const x of r)linked(n,x);const q=dom(n);assert.equal(q.status,201);assert.equal(q.body.total,1104);linked(n,q);});
for(const [name,status] of [['owner',201],['viewer',403]])check(`${name}: permission boundary`,()=>{const n=capture(runs[3],name),q=dom(n);assert.equal(q.status,status);if(status===201)assert.equal(q.body.total,1104);linked(n,q);});
check('session quota: fifth request denied with retry guidance',()=>{const n=capture(runs[3],'quota'),r=dom(n,'probes');assert.deepEqual(r.map(x=>x.status),[201,201,201,201,429]);assert.equal(r[4].retryAfter,'60');for(const x of r)linked(n,x);});
check('v1 public credential is a failed protection (direct HTTP)',()=>{const n=read(`runs/${runs[1]}/baseline-public-token-replay.json`);assert.equal(n.publicCredentialPresent,true);assert.deepEqual(n.rows.map(x=>x.status),[404,200]);});
check('original baseline source is unchanged',()=>{for(const [p,h]of Object.entries(read(`runs/${runs[0]}/baseline-sha256.json`)))assert.equal(sha(fs.readFileSync(path.join(base,'lab',p))),h,p);});
for(const [file,total]of [[`runs/${runs[0]}/logs/node-test.txt`,9],[`runs/${runs[3]}/node-test.txt`,14]])check(`${total} original passing application tests retained`,()=>{let t=fs.readFileSync(path.join(base,file),'utf8');if(t.includes('\u0000'))t=fs.readFileSync(path.join(base,file),'utf16le');assert.match(t,new RegExp('(?:# |ℹ )pass '+total));assert.match(t,/(?:# |ℹ )fail 0/);});
if(fs.existsSync(path.join(base,'SHA256SUMS.json')))check('all distributed file hashes',()=>{for(const [p,h] of Object.entries(read('SHA256SUMS.json')))assert.equal(sha(fs.readFileSync(path.join(base,p))),h,p);});
const result={status:'PASS',commands,scenarioCaptures:scenarios,verifiedCapturedBodies:bodies,checks:checks.length,scope:'Retained evidence assertions; not a universal security proof',results:checks};
console.log(JSON.stringify(result,null,2));
