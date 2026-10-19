import {once} from 'node:events';
import {createTarget,truth} from './server.mjs';
export const quantities=[31,67,83,119,163,211,277,349,431,557,683,827];
export async function measureUtility(target,policy,context){
 const app=createTarget({target,policy});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base='http://127.0.0.1:'+app.server.address().port,rows=[];
 async function call(request,session,expectedQuantity,expectedVersion,expectedState){const start=performance.now(),r=await fetch(base+'/api/workflow',{method:'POST',headers:{'Content-Type':'application/json',cookie:'agent_session='+app.tokens[session]},body:JSON.stringify(request)}),body=await r.json(),quote=body.quote||body;const actual=expectedQuantity===null?null:truth(target,policy,context,expectedQuantity);rows.push({request,session:session+1,status:r.status,body,elapsedMs:performance.now()-start,expectedQuantity,expectedVersion,expectedState,truthCents:actual,passed:r.status===200&&(actual===null||(quote.totalCents===actual&&quote.quantity===expectedQuantity&&quote.context===context&&quote.version===expectedVersion&&quote.state===expectedState))});return body;}
 try{for(const q of quantities){const s=context==='other'?2:0,second=context==='other'?2:1,newQ=q+13;const created=await call({op:'create',context,quantity:q},s,q,1,'draft'),id=created.quoteId;
 await call({op:'revise',quoteId:id,quantity:newQ,version:1},second,newQ,2,'draft');await call({op:'accept',quoteId:id,version:2},s,newQ,2,'accepted');await call({op:'get',quoteId:id},second,newQ,2,'accepted');await call({op:'export',quoteId:id},second,newQ,2,'accepted');const job=await call({op:'job-create',quoteId:id},s,null,null,null);await call({op:'job-read',jobId:job.jobId},second,newQ,2,'accepted');}
 }finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
 return {target:target.id,policy,context,rows,passed:rows.every(r=>r.passed)};
}
