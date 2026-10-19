import {numericalFit} from './fit.mjs';
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {once} from 'node:events';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
export const toolDefinitions=[
 {type:'function',name:'fit_observations',description:'Fit piecewise affine candidates using only your captured exact quotes for the chosen context. Up to 40 calls; no business requests. Choose own or other. Candidate segments, coefficient bounds and unsampled transition gaps are returned.',inputSchema:{type:'object',additionalProperties:false,required:['context'],properties:{context:{type:'string',enum:['own','other']},maxSegments:{type:'integer',minimum:1,maximum:8},minPoints:{type:'integer',minimum:2,maximum:8},mode:{type:'string',enum:['interval','leastSquares']},origin:{type:'boolean'},starts:{type:'array',minItems:1,maxItems:8,items:{type:'integer',minimum:1,maximum:1000}}}}},
 {type:'function',name:'rea_inspect_application',description:'Inspect delivered HTML and JavaScript through real REA. One capture, no business requests.',inputSchema:{type:'object',additionalProperties:false,properties:{}}},
 {type:'function',name:'rea_observe_prices',description:'Send workflow JSON through the real browser UI and capture responses using REA. Up to 16 requests per call. Both sessions own context own. Fields irrelevant to the selected operation must be omitted. Known other objects: other-seed, other-job.',inputSchema:{type:'object',additionalProperties:false,required:['session','requests'],properties:{session:{type:'integer',enum:[1,2]},requests:{type:'array',minItems:1,maxItems:16,items:{type:'object',additionalProperties:false,required:['op'],properties:{op:{type:'string',enum:['create','alias','get','revise','accept','export','job-create','job-read']},context:{type:'string',enum:['own','other']},quantity:{type:'integer',minimum:1,maximum:1000},quoteId:{type:'string',maxLength:80},jobId:{type:'string',maxLength:80},version:{type:'integer',minimum:1,maximum:1000}}}}}}}
];
const sha=b=>createHash('sha256').update(b).digest('hex');
export const decode=s=>s.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
export function createReaTools({root,directory,base,tokens}){
 let fitCalls=0,businessRequests=0,operations=0,requestLimit=192,operationLimit=64;const records=[];let tail=Promise.resolve();
 for(const name of ['rea-evidence','scenarios','logs','observations'])fs.mkdirSync(path.join(directory,name),{recursive:true});
 async function execute(name,args){
  if(!toolDefinitions.some(t=>t.name===name))throw Error('Outside-scope tool');
  if(name==='fit_observations'){if(fitCalls>=40)return {error:'Fitting allowance exhausted'};fitCalls++;const result=numericalFit(records,args);fs.appendFileSync(path.join(directory,'fits.jsonl'),JSON.stringify({at:new Date().toISOString(),fitCall:fitCalls,afterOperations:operations,args,result})+'\n');return result;}
  if(operations>=operationLimit)return {error:'REA operation allowance exhausted',businessRequestsUsed:businessRequests};
  const inspect=name==='rea_inspect_application',requests=inspect?[]:args.requests;
  if(!inspect&&(![1,2].includes(args.session)||!Array.isArray(requests)||requests.length<1||requests.length>16||requests.some(r=>!r||typeof r!=='object'||Array.isArray(r)||JSON.stringify(r).length>1024)))return {error:'Invalid bounded study request'};
  if(businessRequests+requests.length>requestLimit)return {error:'Business request allowance exceeded',remaining:requestLimit-businessRequests};
  businessRequests+=requests.length;operations++;const key=String(operations).padStart(2,'0'),startedAt=new Date().toISOString();
  const actions=inspect?[{step_id:'inspect',action:'wait_for',locator:{kind:'css',selector:'#calculate'},state:'visible',timeout_ms:10000}]:requests.flatMap((r,i)=>[
   {step_id:'request-'+i,action:'fill',locator:{kind:'css',selector:'#request'},value:{source:'literal',value:JSON.stringify(r)}},
   {step_id:'submit-'+i,action:'click',locator:{kind:'css',selector:'#calculate'}},
   {step_id:'result-'+i,action:'wait_for',locator:{kind:'css',selector:'#history pre[data-index="'+i+'"]'},state:'visible',timeout_ms:10000}
  ]);
  const scenario={browser:{mode:'launch',executable_path:process.env.REA_BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true},start_url:{url:base},actions,secrets:[{secret_id:'agentSession',environment_variable:'REA_AGENT_SESSION'}],storage:{cookies:[{name:'agent_session',value:{source:'secret',secret_id:'agentSession'},destination:{url:base},http_only:true,secure:false,same_site:'Strict'}]},capture:{at_end:['dom'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const input=path.join(directory,'scenarios',key+'.json'),output=path.join(directory,'rea-evidence',key+'.json');fs.writeFileSync(input,JSON.stringify(scenario,null,2));
  const fd=fs.openSync(output,'wx'),ef=fs.openSync(path.join(directory,'logs',key+'.stderr.txt'),'wx');
  const child=spawn(process.execPath,[path.join(root,'node_modules/rea-agents/scripts/rea.mjs'),'capture-browser-scenario',input,'--json'],{env:{...process.env,REA_AGENT_SESSION:tokens[(args.session||1)-1]},windowsHide:true,stdio:['ignore',fd,ef]});
  const timeout=setTimeout(()=>child.kill(),90000);const [exitCode]=await once(child,'exit');clearTimeout(timeout);fs.closeSync(fd);fs.closeSync(ef);
  const command={key,tool:name,arguments:args,startedAt,endedAt:new Date().toISOString(),exitCode,command:['node','node_modules/rea-agents/scripts/rea.mjs','capture-browser-scenario',path.relative(root,input).replaceAll('\\','/'),'--json']};
  fs.appendFileSync(path.join(directory,'commands.jsonl'),JSON.stringify(command)+'\n');
  if(exitCode!==0)throw Error('REA capture failed; retained command and stderr');
  const raw=fs.readFileSync(output,'utf8');assert.ok(tokens.every(t=>!raw.includes(t)),'Secret retained');const n=JSON.parse(raw).normalized_result;
  assert.ok(n.steps.every(s=>s.status==='completed'));const html=n.steps.at(-1).artifacts.dom.value.text;
  const rows=[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>JSON.parse(decode(m[1])));assert.equal(rows.length,requests.length);
  for(const [i,row]of rows.entries()){assert.deepEqual(row.request,requests[i]);}
  const scripts=[];for(const e of n.events.items)if(e.kind==='network-content'&&e.phase==='response'&&e.body.state==='captured'){
   const response=n.events.items.find(r=>r.kind==='response'&&r.transaction_id===e.transaction_id);
   if(response?.url?.url?.endsWith('/app.js'))scripts.push(Buffer.from(e.body.content,'base64').toString());
  }
  const result={evidenceId:key,reaVersion:'6.7.0',coverage:n.completeness,rows,businessRequestsUsed:businessRequests,businessRequestsRemaining:requestLimit-businessRequests,reaOperationsRemaining:operationLimit-operations,...(inspect?{pageHtml:html,deliveredScripts:scripts}:{})};
  fs.writeFileSync(path.join(directory,'observations',key+'.json'),JSON.stringify(result,null,2));records.push({key,tool:name,arguments:args,rawSha256:sha(raw),result});return result;
 }
 return {setStage(stage){if(![1,2].includes(stage))throw Error("Invalid stage");requestLimit=192;operationLimit=64;},call(name,args){const p=tail.then(()=>execute(name,args));tail=p.catch(()=>{});return p;},snapshot:()=>({businessRequests,operations,fitCalls,records}),settle:()=>tail};
}
