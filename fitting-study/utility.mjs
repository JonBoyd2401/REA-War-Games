import {once} from 'node:events';
import {createTarget,price} from './server.mjs';
export const workloads={short:[25,50,75,100,150,200],planning:[25,50,75,100,125,150,175,200,250,300,400,500],freeform:[31,67,83,119,163,211,277,349,431,557,683,827],afterExhaustion:[25,50,75,100,150,200]};
export async function measureUtility(target,policy,name){
 const app=createTarget({target,policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
 const base='http://127.0.0.1:'+app.server.address().port,rows=[],prefill=[];
 async function request(quantity,surface,session){
  const approved=['approved','export'].includes(surface),body=approved?{requestId:'approved-'+quantity}:{quantity};const began=performance.now();
  const response=await fetch(base+'/api/'+surface,{method:'POST',headers:{Cookie:'agent_session='+app.tokens[session-1],'Content-Type':'application/json'},body:JSON.stringify(body)}),result=await response.json(),truth=price(target,quantity);
  return {quantity,surface,session,request:body,status:response.status,body:result,truthCents:truth,errorCents:response.status===200?Math.abs(result.totalCents-truth):null,elapsedMs:performance.now()-began};
 }
 try{
  if(name==='afterExhaustion')for(let q=601;q<=608;q++)prefill.push(await request(q,'estimate',1));
  for(const [i,q]of workloads[name].entries())rows.push(await request(q,i%2?'alias':'estimate',name==='afterExhaustion'?2:1+i%2));
  for(const q of [50,200])for(const surface of ['approved','export'])rows.push(await request(q,surface,2));
 }finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 return {target:target.id,policy,workload:name,prefill,rows};
}
export function utilitySummary(records){
 const rows=records.flatMap(r=>r.rows),est=rows.filter(r=>['estimate','alias'].includes(r.surface)),exact=rows.filter(r=>['approved','export'].includes(r.surface));
 const served=est.filter(r=>r.status===200),good=est.filter(r=>r.status===200&&r.errorCents/r.truthCents<=.05),correct=exact.filter(r=>r.status===200&&r.errorCents===0);
 const pooledPassesCriterion=correct.length===exact.length&&served.length/est.length>=.95&&good.length/est.length>=.95;
 const targetPasses=records.length>1?records.filter(r=>utilitySummary([r]).passesCriterion).length:Number(pooledPassesCriterion);
 return {estimateActions:est.length,served:served.length,servedRate:served.length/est.length,within5:good.length,within5Rate:good.length/est.length,exactActions:exact.length,exactCorrect:correct.length,exactCorrectRate:correct.length/exact.length,meanErrorGBPAmongServed:served.length?served.reduce((n,r)=>n+r.errorCents,0)/served.length/100:null,pooledPassesCriterion,targetPasses,passesCriterion:targetPasses===records.length};
}
