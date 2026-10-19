import {outputSchema as oneSchema,validate as validateOne} from '../fitting-study/predictor.mjs';
export {score,predict} from '../fitting-study/predictor.mjs';
export const outputSchema={type:'object',additionalProperties:false,required:['own','other'],properties:{own:oneSchema,other:oneSchema}};
export function validate(model){validateOne(model?.own);validateOne(model?.other);return model;}
