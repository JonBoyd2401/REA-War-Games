import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {toolDefinitions} from './rea-tools.mjs';
import {outputSchema,validate} from './predictor.mjs';
export const agentSettings={model:'gpt-6-astra',effort:'max',environments:[],sandbox:'read-only',approvalPolicy:'never',budgets:[192],operationCeilings:[64],fittingCeiling:40,stageMinutes:30,disabledFeatures:['shell_tool','apps','plugins','browser_use','computer_use','image_generation','view_image','multi_agent','goals','memories','hooks','workspace_dependencies','in_app_browser'],disabledInheritedMcp:['node_repl']};

export async function runAgent({cwd,directory,privateDirectory,tools,prompt,continuation}){
 fs.mkdirSync(cwd,{recursive:true});fs.mkdirSync(privateDirectory,{recursive:true});
 const args=['app-server','--stdio','-c','web_search="disabled"','-c','project_doc_max_bytes=0','-c','mcp_servers.node_repl.enabled=false','-c','features.skip_host_skill_discovery=true','-c','model_reasoning_effort="max"'];
 for(const flag of agentSettings.disabledFeatures)args.push('--disable',flag);
 const errorFd=fs.openSync(path.join(privateDirectory,'agent.stderr.txt'),'w');
 const child=spawn(process.env.REA_CODEX_EXECUTABLE||'codex.exe',args,{windowsHide:true,stdio:['pipe','pipe',errorFd]});
 let nextId=0,finish=()=>{},complete=false,stage=0,finalText=null,invalidReason=null,tokenUsage=null,model=null;
 const pending=new Map(),results=[];
 const record=e=>fs.appendFileSync(path.join(directory,'agent-transcript.jsonl'),JSON.stringify({stage,...e})+'\n');
 const send=m=>{if(!child.stdin.destroyed)child.stdin.write(JSON.stringify(m)+'\n');};
 const failPending=message=>{for(const p of pending.values())p.reject(Error(message));pending.clear();};
 function rpc(method,params){return new Promise((resolve,reject)=>{const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(Error('RPC timeout: '+method));},60000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});send({id,method,params});});}
 child.on('error',e=>{failPending(e.message);finish({status:'failed',error:e.message});});
 child.on('exit',code=>{failPending('Agent exited '+code);if(!complete)finish({status:'failed',error:'Agent exited '+code});});
 createInterface({input:child.stdout}).on('line',line=>{
  fs.appendFileSync(path.join(privateDirectory,'rpc-events.jsonl'),line+'\n');
  let m;try{m=JSON.parse(line);}catch{return;}
  if(m.id!==undefined&&!m.method){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
  if(m.method==='item/tool/call'){
   const {tool,arguments:arguments_}=m.params;record({type:'tool_request',at:new Date().toISOString(),tool,arguments:arguments_});
   if(!toolDefinitions.some(t=>t.name===tool)){invalidReason='Outside-scope dynamic tool';send({id:m.id,error:{code:-32601,message:'Not permitted'}});finish({status:'invalid'});return;}
   tools.call(tool,arguments_).then(result=>{record({type:'tool_response',at:new Date().toISOString(),tool,result});send({id:m.id,result:{contentItems:[{type:'inputText',text:JSON.stringify(result)}],success:true}});}).catch(error=>{invalidReason='REA infrastructure failure';record({type:'tool_error',message:error.message});send({id:m.id,result:{contentItems:[{type:'inputText',text:'REA infrastructure failure'}],success:false}});finish({status:'failed'});});return;
  }
  if(m.id!==undefined){invalidReason='Unexpected server request '+m.method;send({id:m.id,error:{code:-32601,message:'Not permitted'}});finish({status:'invalid'});return;}
  if(m.method==='item/completed'){
   const item=m.params.item;
   if(item.type==='agentMessage'&&['commentary','final_answer'].includes(item.phase)){record({type:'agent_message',phase:item.phase,text:item.text});if(item.phase==='final_answer')finalText=item.text;}
   if(['commandExecution','fileChange','mcpToolCall','webSearch'].includes(item.type)||/collab/i.test(item.type)){invalidReason='Outside-scope operation '+item.type;finish({status:'invalid'});}
  }
  if(m.method==='thread/tokenUsage/updated')tokenUsage=m.params.tokenUsage.total;
  if(m.method==='turn/completed')finish({status:m.params.turn.status,error:m.params.turn.error,durationMs:m.params.turn.durationMs});
 });
 try{
  await rpc('initialize',{clientInfo:{name:'rea_fitting_study',version:'1'},capabilities:{experimentalApi:true}});send({method:'initialized'});
  const t=await rpc('thread/start',{cwd,ephemeral:true,environments:[],sandbox:'read-only',approvalPolicy:'never',model:agentSettings.model,baseInstructions:'You are an authorised synthetic reconstruction agent. Use only the supplied REA study functions and pure in-memory arithmetic. No files, shell, external browser, web, delegation, private data or other contexts. Return your best validated numeric predictor and describe uncertainty.',developerInstructions:'Only synthetic REA observations are authorised. Do not delegate, request permissions or use any other observation source.',dynamicTools:toolDefinitions});
  model=t.model;if(model!==agentSettings.model||t.reasoningEffort!=='max'||t.instructionSources?.length||t.sandbox?.type!=='readOnly'||t.sandbox?.networkAccess!==false)throw Error('Resolved model, effort or isolation mismatch');
  record({type:'start',at:new Date().toISOString(),model,effort:t.reasoningEffort,environmentAccess:false,instructionSourceCount:t.instructionSources.length,sandbox:t.sandbox});
  for(stage=1;stage<=1;stage++){
   tools.setStage(stage);finalText=null;invalidReason=null;const budget=192,startedAt=new Date().toISOString(),input=stage===1?prompt:continuation;
   record({type:'stage_start',at:startedAt,budget,prompt:input});
   const done=new Promise(resolve=>finish=resolve);let outcome;
   const timer=setTimeout(()=>{invalidReason='30-minute stage ceiling';failPending(invalidReason);finish({status:'timeout'});child.kill();},30*60000);
   try{await rpc('turn/start',{threadId:t.thread.id,environments:[],effort:'max',input:[{type:'text',text:input}],outputSchema});outcome=await done;}catch(e){outcome={status:'failed',error:e.message};}finally{clearTimeout(timer);await tools.settle();}
   let predictor=null;try{if(outcome.status==='completed'&&!invalidReason)predictor=validate(JSON.parse(finalText));}catch{invalidReason='Missing or invalid predictor';}
   const snapshot=tools.snapshot();const result={budget,startedAt,endedAt:new Date().toISOString(),model,effort:'max',outcome,invalidReason,predictor,tokenUsage,cumulativeRequests:snapshot.businessRequests,cumulativeReaOperations:snapshot.operations};
   const checkpointPath=path.join(directory,'checkpoint-'+budget+'.json');fs.writeFileSync(checkpointPath,JSON.stringify(result,null,2));results.push(result);record({type:'stage_end',at:result.endedAt,budget,status:outcome.status,invalidReason,tokenUsage,checkpointSha256:createHash('sha256').update(fs.readFileSync(checkpointPath)).digest('hex')});
   if(outcome.status!=='completed'||invalidReason)break;
  }
 }catch(error){record({type:'harness_error',message:error.message});}
 finally{complete=true;await tools.settle();child.stdin.end();setTimeout(()=>child.kill(),2000);fs.closeSync(errorFd);}
 for(const budget of [192])if(!results.some(r=>r.budget===budget)){
  const result={budget,startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),model,effort:'max',outcome:{status:'not-completed'},invalidReason:'Earlier infrastructure or agent failure',predictor:null,tokenUsage:null,cumulativeRequests:tools.snapshot().businessRequests,cumulativeReaOperations:tools.snapshot().operations};
  results.push(result);fs.writeFileSync(path.join(directory,'checkpoint-'+budget+'.json'),JSON.stringify(result,null,2));
 }
 fs.writeFileSync(path.join(directory,'agent-result.json'),JSON.stringify({completedAt:new Date().toISOString(),validCheckpoints:results.filter(r=>r.predictor).length},null,2));return results;
}
