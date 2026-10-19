import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),id=process.argv[2]||'reconstruction-20261019',run=path.join(root,'runs',id),all=JSON.parse(fs.readFileSync(path.join(run,'scores.json'))).scores;
const median=a=>{const x=[...a].sort((a,b)=>a-b);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;};
const stats=a=>({mean:a.reduce((x,y)=>x+y,0)/a.length,median:median(a),min:Math.min(...a),max:Math.max(...a)});
const summary=[];
for(const policy of ['exact','tenant-budget-8','rounded-1000','catalogue-only','estimate-plus-approved-quote'])for(const budget of [8,24,64]){
 const rows=all.filter(s=>s.policy===policy&&s.budget===budget&&s.source==='localhost HTTP');
 const best=[];for(const target of new Set(rows.map(r=>r.target))){const candidates=rows.filter(r=>r.target===target);best.push({target,exact:Math.max(...candidates.map(r=>r.exactFraction)),within1:Math.max(...candidates.map(r=>r.within1Percent)),within5:Math.max(...candidates.map(r=>r.within5Percent)),mae:Math.min(...candidates.map(r=>r.meanAbsoluteGBP)),medianError:Math.min(...candidates.map(r=>r.medianErrorPercent))});}
 summary.push({policy,budget,targets:16,selection:'Per-metric best of two learners; an evaluation upper bound, not one selected deployed predictor',exactFraction:stats(best.map(r=>r.exact)),within1Percent:stats(best.map(r=>r.within1)),within5Percent:stats(best.map(r=>r.within5)),meanAbsoluteGBP:stats(best.map(r=>r.mae)),medianErrorPercent:stats(best.map(r=>r.medianError)),requests:stats(rows.map(r=>r.requests)),successfulDistinct:stats(rows.map(r=>r.successfulDistinct)),perTarget:best});
}
const result={run:id,summary,rea:all.filter(s=>s.source==='REA browser capture').map(({errors,...s})=>s)};
fs.writeFileSync(path.join(run,'aggregate.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(summary.map(({perTarget,...s})=>s),null,2));
