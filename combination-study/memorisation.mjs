import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {catalogue,price,delivered} from './server.mjs';
// Supplementary analysis added after protocol freeze. No new agent or HTTP calls.
// Replay only numeric outputs already observed by that cell at that checkpoint.
export function replayMemorisation(run){
 const read=n=>JSON.parse(fs.readFileSync(path.join(run,n)));assert.equal(read('model-freezes.json').models.length,84);
 const targets=read('targets.json'),order=read('schedule.json'),rows=[];
 for(const cell of order.filter(c=>['round100-catalogue16','approved-only'].includes(c.policy)))for(const budget of [96,192]){
  const prefix='cells/'+cell.cell+'/',checkpoint=read(prefix+'checkpoint-'+budget+'.json'),table=new Map(),supported=cell.policy==='approved-only'?[50,200]:catalogue;
  const commands=fs.readFileSync(path.join(run,prefix+'commands.jsonl'),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
  for(const command of commands.filter(c=>c.exitCode===0&&Date.parse(c.endedAt)<=Date.parse(checkpoint.endedAt))){const observation=read(prefix+'observations/'+command.key+'.json');for(const [index,row]of observation.rows.entries()){
   if(row.status!==200||!supported.includes(row.quantity))continue;
   if(cell.policy==='approved-only'?!['approved','export'].includes(row.surface):!['estimate','alias'].includes(row.surface))continue;
   if(table.has(row.quantity))assert.equal(table.get(row.quantity).totalCents,row.body.totalCents);
   table.set(row.quantity,{quantity:row.quantity,totalCents:row.body.totalCents,operation:command.key,rowIndex:index});
  }}
  const target=targets.find(t=>t.id===cell.target),predictions=supported.map(quantity=>{const remembered=table.get(quantity),actualCents=delivered(price(target,quantity),cell.policy,cell.policy==='approved-only'?'approved':'estimate');return {quantity,actualCents,rememberedCents:remembered?.totalCents??null,exact:remembered?.totalCents===actualCents};});
  rows.push({...cell,budget,supportedInputs:supported.length,observedInputs:table.size,exactReplay:predictions.filter(r=>r.exact).length/supported.length,lookup:[...table.values()].sort((a,b)=>a.quantity-b.quantity),predictions});
 }
 return {analysis:'Supplementary offline replay added after protocol freeze; not an independent agent or held-out test. Only already observed supported numeric outputs are memorised; unknown inputs abstain. No new requests or fitted coefficients.',rows,summary:[96,192].flatMap(budget=>['round100-catalogue16','approved-only'].map(policy=>{const r=rows.filter(x=>x.budget===budget&&x.policy===policy);return {budget,policy,targets:r.length,observedInputs:r.reduce((s,x)=>s+x.observedInputs,0),supportedInputs:r.reduce((s,x)=>s+x.supportedInputs,0),meanExactReplay:r.reduce((s,x)=>s+x.exactReplay,0)/r.length,targetsWithFullReplay:r.filter(x=>x.exactReplay===1).length};}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),run=path.resolve(root,process.argv[2]||'runs/combinations-20261019');fs.writeFileSync(path.join(run,'memorisation.json'),JSON.stringify(replayMemorisation(run),null,2)+'\n');console.log('Wrote supplementary lookup replay, using no new observations.');}
