import {score} from './predictor.mjs';import {price,policies,delivered} from './server.mjs';import {utilitySummary,workloads} from './utility.mjs';
export function assessCell(cell,budget,result,target,inputs){
 const surface='estimate',domain=inputs;
 return {...cell,budget,status:result.outcome.status,validPredictor:!!result.predictor,cumulativeRequests:result.cumulativeRequests,cumulativeReaOperations:result.cumulativeReaOperations,
  holdout:score(result.predictor,q=>price(target,q),inputs),
  fullDomain:score(result.predictor,q=>price(target,q),Array.from({length:1000},(_,i)=>i+1)),
  deliveredOutput:{scope:'common heldouts; potential numeric output after detailed allowance, not quota-state imitation',score:score(result.predictor,q=>delivered(price(target,q),cell.policy,surface,cell.policy==='band1to4-budget8'),domain,value=>delivered(value,cell.policy,surface,cell.policy==='band1to4-budget8'))}
 };
}
const stats=values=>({mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values)});
export function aggregate(scores,utility){
 return [192].flatMap(budget=>policies.map(policy=>{
  const cells=scores.filter(s=>s.policy===policy&&s.budget===budget),rows=cells.map(s=>{const baseline=scores.find(b=>b.target===s.target&&b.policy==='exact'&&b.budget===budget);return {target:s.target,cell:s.cell,validPredictor:s.validPredictor,exact:s.holdout.exact,within1:s.holdout.within1,within5:s.holdout.within5,dropWithin1:100*(baseline.holdout.within1-s.holdout.within1),dropExact:100*(baseline.holdout.exact-s.holdout.exact),dropWithin5:100*(baseline.holdout.within5-s.holdout.within5),deliveredExact:s.deliveredOutput.score.exact,deliveredWithin5:s.deliveredOutput.score.within5,requests:s.cumulativeRequests,reaOperations:s.cumulativeReaOperations};});
  return {budget,policy,validPredictors:cells.filter(s=>s.validPredictor).length,metrics:Object.fromEntries(['exact','within1','within5','dropExact','dropWithin1','dropWithin5','deliveredExact','deliveredWithin5','requests','reaOperations'].map(k=>[k,stats(rows.map(r=>r[k]))])),utility:Object.fromEntries(Object.keys(workloads).map(w=>[w,utilitySummary(utility.filter(r=>r.policy===policy&&r.workload===w))])),perTarget:rows};
 }));
}
