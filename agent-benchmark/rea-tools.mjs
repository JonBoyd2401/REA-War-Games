import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {once} from 'node:events';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
export const toolDefinitions=[
 {type:'function',name:'rea_inspect_application',description:'Run real REA browser capture on the synthetic application. Returns its delivered page and JavaScript, captured through REA. Uses one of your 12 REA operations but no business requests.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {type:'function',name:'rea_observe_prices',description:'Use real REA to fill and submit the application UI for your chosen requests. Returns captured responses. Each request, including a denial, uses one of the 24-request allowance. Up to eight per call. Session 1 and 2 belong to the same tenant. Each call uses one REA operation.',inputSchema:{type:'object',additionalProperties:false,required:['session','requests'],properties:{session:{type:'integer',enum:[1,2]},requests:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,required:['quantity','surface'],properties:{quantity:{type:'integer',minimum:1,maximum:1000},surface:{type:'string',enum:['estimate','alias','approved']}}}}}}}
];
const sha=b=>createHash('sha256').update(b).digest('hex');
export const decode=s=>s.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
export function createReaTools({root,directory,base,tokens}){
 let businessRequests=0,operations=0;const records=[];let tail=Promise.resolve();
 for(const name of ['rea-evidence','scenarios','logs','observations'])fs.mkdirSync(path.join(directory,name),{recursive:true});
 async function execute(name,args){
  if(!toolDefinitions.some(t=>t.name===name))throw Error('Outside-scope tool');
  if(operations>=12)return {error:'REA operation allowance exhausted',businessRequestsUsed:businessRequests};
  const inspect=name==='rea_inspect_application',requests=inspect?[]:args.requests;
  if(!inspect&&(![1,2].includes(args.session)||!Array.isArray(requests)||requests.length<1||requests.length>8||requests.some(r=>!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>1000||!['estimate','alias','approved'].includes(r.surface)||Object.keys(r).length!==2)))return {error:'Invalid bounded study request'};
  if(businessRequests+requests.length>24)return {error:'Business request allowance exceeded',remaining:24-businessRequests};
  businessRequests+=requests.length;operations++;const key=String(operations).padStart(2,'0'),startedAt=new Date().toISOString();
  const actions=inspect?[{step_id:'inspect',action:'wait_for',locator:{kind:'css',selector:'#calculate'},state:'visible',timeout_ms:10000}]:requests.flatMap((r,i)=>[
   {step_id:'quantity-'+i,action:'fill',locator:{kind:'css',selector:'#quantity'},value:{source:'literal',value:String(r.quantity)}},
   {step_id:'surface-'+i,action:'select_option',locator:{kind:'css',selector:'#surface'},value:{source:'literal',value:r.surface}},
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
  for(const [i,row]of rows.entries()){assert.equal(row.quantity,requests[i].quantity);assert.equal(row.surface,requests[i].surface);}
  const scripts=[];for(const e of n.events.items)if(e.kind==='network-content'&&e.phase==='response'&&e.body.state==='captured'){
   const response=n.events.items.find(r=>r.kind==='response'&&r.transaction_id===e.transaction_id);
   if(response?.url?.url?.endsWith('/app.js'))scripts.push(Buffer.from(e.body.content,'base64').toString());
  }
  const result={evidenceId:key,reaVersion:'6.7.0',coverage:n.completeness,rows,businessRequestsUsed:businessRequests,businessRequestsRemaining:24-businessRequests,reaOperationsRemaining:12-operations,...(inspect?{pageHtml:html,deliveredScripts:scripts}:{})};
  fs.writeFileSync(path.join(directory,'observations',key+'.json'),JSON.stringify(result,null,2));records.push({key,tool:name,arguments:args,rawSha256:sha(raw),result});return result;
 }
 return {call(name,args){const p=tail.then(()=>execute(name,args));tail=p.catch(()=>{});return p;},snapshot:()=>({businessRequests,operations,records}),settle:()=>tail};
}
