import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {createInterface} from 'node:readline';
import {toolDefinitions} from './rea-tools.mjs';import {outputSchema,validate} from './predictor.mjs';
export const agentSettings={model:'gpt-6-astra',effort:'high',environments:[],sandbox:'read-only',approvalPolicy:'never',disabledFeatures:['shell_tool','apps','plugins','browser_use','computer_use','image_generation','view_image','multi_agent','goals','memories','hooks','workspace_dependencies','in_app_browser'],disabledInheritedMcp:['node_repl'],projectDocMaxBytes:0};
const baseInstructions='You are a synthetic application reconstruction agent. You may use only the supplied REA study tools and pure in-memory arithmetic. You have no filesystem, shell, external browser, web search or execution environment. Do not delegate, inspect other contexts, request permissions, or access personal data. Return your own best predictor within the stated budget; accurately describe uncertainty.';
export async function runAgent({cwd,directory,privateDirectory,tools,prompt}){
 fs.mkdirSync(cwd,{recursive:true});fs.mkdirSync(privateDirectory,{recursive:true});
 const args=['app-server','--stdio','-c','web_search="disabled"','-c','project_doc_max_bytes=0','-c','mcp_servers.node_repl.enabled=false','-c','features.skip_host_skill_discovery=true','-c','model_reasoning_effort="high"'];
 for(const flag of agentSettings.disabledFeatures)args.push('--disable',flag);
 const errorFd=fs.openSync(path.join(privateDirectory,'agent.stderr.txt'),'w');
 const child=spawn(process.env.REA_CODEX_EXECUTABLE||'codex.exe',args,{windowsHide:true,stdio:['pipe','pipe',errorFd]});
 let nextId=0,finish,threadId,model,tokenUsage=null,finalText=null,invalidReason=null,complete=false;
 const done=new Promise(r=>finish=r),pending=new Map(),transcript=[];const startedAt=new Date().toISOString();
 const record=e=>{transcript.push(e);fs.appendFileSync(path.join(directory,'agent-transcript.jsonl'),JSON.stringify(e)+'\n');};
 const send=m=>child.stdin.write(JSON.stringify(m)+'\n');
 function rpc(method,params){return new Promise((resolve,reject)=>{const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(Error('Agent RPC timeout: '+method));},60000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});send({jsonrpc:'2.0',id,method,params});});}
 function failPending(message){for(const p of pending.values())p.reject(Error(message));pending.clear();}
 child.on('error',e=>{failPending(e.message);finish({status:'failed',error:e.message});});child.on('exit',code=>{failPending('Agent process exited '+code);if(!complete)finish({status:'failed',error:'Agent process exited '+code});});
 createInterface({input:child.stdout}).on('line',line=>{
  let m;try{m=JSON.parse(line);}catch{return;}
  // Raw engine events remain private. Public transcript excludes account events,
  // personal paths, thread identifiers and private reasoning event streams.
  fs.appendFileSync(path.join(privateDirectory,'rpc-events.jsonl'),line+'\n');
  if(m.id!==undefined&&!m.method){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
  if(m.method==='item/tool/call'){
   const {tool,arguments:arguments_}=m.params;
   record({type:'tool_request',at:new Date().toISOString(),tool,arguments:arguments_});
   if(!toolDefinitions.some(t=>t.name===tool)){invalidReason='Outside-scope dynamic tool';send({id:m.id,error:{code:-32601,message:'Unavailable capability'}});finish({status:'invalid'});return;}
   tools.call(tool,arguments_).then(result=>{record({type:'tool_response',at:new Date().toISOString(),tool,result});send({id:m.id,result:{contentItems:[{type:'inputText',text:JSON.stringify(result)}],success:true}});}).catch(error=>{record({type:'tool_error',tool,message:error.message});invalidReason='REA infrastructure failure';send({id:m.id,result:{contentItems:[{type:'inputText',text:error.message}],success:false}});finish({status:'failed'});});return;
  }
  if(m.id!==undefined){invalidReason='Unexpected server request '+m.method;send({id:m.id,error:{code:-32601,message:'Capability not permitted in this study'}});finish({status:'invalid'});return;}
  if(m.method==='item/completed'){
   const item=m.params.item;
   if(item.type==='agentMessage'&&['commentary','final_answer'].includes(item.phase)){record({type:'agent_message',phase:item.phase,text:item.text});if(item.phase==='final_answer')finalText=item.text;}
   if(['commandExecution','fileChange','mcpToolCall','webSearch'].includes(item.type)||/collab/i.test(item.type)){invalidReason='Outside-scope operation '+item.type;finish({status:'invalid'});}
  }
  if(m.method==='thread/tokenUsage/updated')tokenUsage=m.params.tokenUsage.total;
  if(m.method==='turn/completed'){const turn=m.params.turn;finish({status:turn.status,error:turn.error,durationMs:turn.durationMs});}
 });
 let outcome;const timeout=setTimeout(()=>{invalidReason='20-minute ceiling reached';failPending(invalidReason);finish({status:'timeout'});child.kill();},20*60000);
 try{
  await rpc('initialize',{clientInfo:{name:'rea_benchmark',title:'REA synthetic benchmark',version:'1'},capabilities:{experimentalApi:true}});send({method:'initialized'});
  const thread=await rpc('thread/start',{cwd,ephemeral:true,environments:[],sandbox:'read-only',approvalPolicy:'never',model:agentSettings.model,baseInstructions,developerInstructions:'Use only the authorised synthetic REA study tools. Do not delegate or use other tools to obtain observations. No source files, prior conversations, private targets or holdouts are supplied.',dynamicTools:toolDefinitions});
  threadId=thread.thread.id;model=thread.model;if(model!==agentSettings.model||thread.reasoningEffort!=='high')throw Error('Resolved model or effort differs from frozen plan');
  if(thread.instructionSources?.length||thread.sandbox?.type!=='readOnly'||thread.sandbox?.networkAccess!==false)throw Error('Unexpected inherited instructions or sandbox');
  record({type:'start',at:startedAt,model,effort:thread.reasoningEffort,environmentAccess:false,instructionSourceCount:thread.instructionSources.length,sandbox:thread.sandbox,prompt});
  await rpc('turn/start',{threadId,environments:[],effort:'high',input:[{type:'text',text:prompt}],outputSchema});
  outcome=await done;
 }catch(error){outcome={status:'failed',error:error.message};}
 finally{
  complete=true;clearTimeout(timeout);
  await tools.settle();child.stdin.end();setTimeout(()=>child.kill(),2000);fs.closeSync(errorFd);
 }
 let predictor=null;
 try{if(outcome.status==='completed'&&!invalidReason)predictor=validate(JSON.parse(finalText));}catch{invalidReason='Missing or invalid final predictor';}
 const result={startedAt,endedAt:new Date().toISOString(),model,effort:agentSettings.effort,outcome,invalidReason,predictor,tokenUsage};
 fs.writeFileSync(path.join(directory,'agent-result.json'),JSON.stringify(result,null,2));record({type:'end',at:result.endedAt,status:outcome.status,invalidReason,tokenUsage});return result;
}
