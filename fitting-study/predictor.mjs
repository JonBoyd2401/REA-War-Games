export const outputSchema={type:'object',additionalProperties:false,required:['segments','notes'],properties:{segments:{type:'array',minItems:1,maxItems:32,items:{type:'object',additionalProperties:false,required:['from','constant','linear','quadratic'],properties:{from:{type:'integer',minimum:1,maximum:1000},constant:{type:'number'},linear:{type:'number'},quadratic:{type:'number'}}}},notes:{type:'string'}}};
export function validate(model){
 if(!model||!Array.isArray(model.segments)||model.segments.length<1||model.segments.length>32||model.segments[0].from!==1)throw Error('Invalid predictor');
 for(const [i,s]of model.segments.entries())if(!Number.isInteger(s.from)||s.from<1||s.from>1000||(i&&s.from<=model.segments[i-1].from)||!['constant','linear','quadratic'].every(k=>Number.isFinite(s[k])&&Math.abs(s[k])<=1e10))throw Error('Invalid segment');
 return model;
}
export function predict(model,q){const s=model.segments.findLast(s=>s.from<=q);return Math.max(0,Math.round(s.constant+s.linear*q+s.quadratic*q*q));}
export function score(model,truth,inputs,transform=value=>value){
 const errors=inputs.map(q=>{const actual=truth(q),predicted=model?transform(predict(model,q),q):null,error=predicted===null?null:Math.abs(predicted-actual);return {quantity:q,actualCents:actual,predictedCents:predicted,errorCents:error,errorFraction:error===null?null:error/Math.max(1,actual)};});
 return {exact:errors.filter(e=>e.errorCents===0).length/inputs.length,within1:errors.filter(e=>e.errorFraction!==null&&e.errorFraction<=.01).length/inputs.length,within5:errors.filter(e=>e.errorFraction!==null&&e.errorFraction<=.05).length/inputs.length,meanAbsoluteGBP:model?errors.reduce((s,e)=>s+e.errorCents,0)/inputs.length/100:null,errors};
}
