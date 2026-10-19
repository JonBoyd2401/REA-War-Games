import {numericalFit as fit} from '../fitting-study/fit.mjs';
export function numericalFit(records,args={}){
 const {context,...options}=args;if(!['own','other'].includes(context))return {error:'Choose own or other context'};
 const filtered=records.map(r=>({result:{rows:r.result.rows.flatMap(row=>{const b=row.body.quote||row.body;return row.status===200&&b.context===context&&Number.isFinite(b.totalCents)?[{status:200,quantity:b.quantity,body:{totalCents:b.totalCents}}]:[]})}}));
 return fit(filtered,options);
}
