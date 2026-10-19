// Portable local-only REA capture runner. Run from a clean copy of the sharing kit.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const browser=process.argv[2];const runId=process.argv[3]??`replication-${Date.now()}`;
if(!browser||!path.isAbsolute(browser)||!fs.existsSync(browser)||!/^[a-zA-Z0-9][\w.-]{0,70}$/.test(runId))throw Error('Usage: node reproduce.mjs ABSOLUTE_CHROME_PATH UNIQUE_RUN_ID');
const cli=path.join(root,'node_modules/rea-agents/scripts/rea.mjs');
if(!fs.existsSync(cli))throw Error('Install first: npm install --ignore-scripts --save-exact rea-agents@6.7.0');
const installed=JSON.parse(fs.readFileSync(path.join(root,'node_modules/rea-agents/package.json')));
if(installed.version!=='6.7.0')throw Error('Expected pinned REA 6.7.0');
const {createApp}=await import(new URL('./lab/server.mjs',import.meta.url));
const run=path.join(root,'replications',runId);fs.mkdirSync(run,{recursive:true});
if(fs.existsSync(path.join(run,'commands.jsonl')))throw Error('Choose a fresh RUN_ID; refusing overwrite');
for(const dir of ['rea-evidence','scenarios','logs','profiles'])fs.mkdirSync(path.join(run,dir),{recursive:true});
async function command(name,args,onArmed){
 const start=new Date().toISOString();let stderr='';let action;const out=fs.openSync(path.join(run,'rea-evidence',name+'.json'),'wx');
 const p=spawn(process.execPath,[cli,...args,'--json'],{cwd:root,windowsHide:true,stdio:['ignore',out,'pipe']});
 const timer=setTimeout(()=>p.kill(),120000);
 p.stderr.on('data',b=>{stderr+=b.toString();if(onArmed&&!action&&stderr.includes('observation armed;'))action=onArmed();});
 const [code]=await once(p,'exit');clearTimeout(timer);fs.closeSync(out);if(action)await action;
 fs.writeFileSync(path.join(run,'logs',name+'.stderr.txt'),stderr);
 fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({start,end:new Date().toISOString(),executable:process.execPath,args:[cli,...args,'--json'],code,armedAction:onArmed?Boolean(action):null})+'\n');
 if(code!==0)throw Error(`${name} failed; inspect logs`);
 const result=JSON.parse(fs.readFileSync(path.join(run,'rea-evidence',name+'.json')));console.log(name+' captured');return result;
}
async function cdp(url){const socket=new WebSocket(url);await once(socket,'open');let id=0;const pending=new Map();socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result);}});return {send:(method,params={})=>new Promise((resolve,reject)=>{const current=++id;pending.set(current,{resolve,reject});socket.send(JSON.stringify({id:current,method,params}));}),close:()=>socket.close()};}
async function freePort(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
for(const mode of ['unsafe','hardened']){
 const app=createApp({mode});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;
 let chrome;let debuggerClient;let pageClient;
 try{
  const scenario={browser:{mode:'launch',executable_path:browser,headless:true},start_url:{url:base},actions:[{step_id:'quote-click',action:'click',locator:{kind:'css',selector:'#quote'},timeout_ms:10000},{step_id:'quote-rendered',action:'wait_for',locator:{kind:'css',selector:'#result:not(:empty)'},state:'visible',timeout_ms:10000}],capture:{at_end:['dom','accessibility','url'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const scenarioPath=path.join(run,'scenarios',mode+'.json');fs.writeFileSync(scenarioPath,JSON.stringify(scenario,null,2));await command(mode+'-scenario',['capture-browser-scenario',scenarioPath]);
  const port=await freePort();const endpoint=`http://127.0.0.1:${port}`;
  chrome=spawn(browser,['--headless=new','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1',`--user-data-dir=${path.join(run,'profiles',mode)}`,base],{windowsHide:true,stdio:'ignore'});
  let version;for(let i=0;i<100;i++){try{version=await (await fetch(endpoint+'/json/version')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}if(!version)throw Error('CDP browser did not start');
  debuggerClient=await cdp(version.webSocketDebuggerUrl);
  const targets=await command(mode+'-targets',['list-browser-targets',endpoint]);const target=targets.normalized_result.targets.find(t=>t.origin===base)?.target_id;if(!target)throw Error('Lab target missing');
  for(const [suffix,args] of [['inspect',['inspect-web-page',endpoint,target,'--include-script-sources','--include-json-body-shapes','--include-accessibility-text']],['bundle',['analyze-web-bundle',endpoint,target]],['bundle-maps',['analyze-web-bundle',endpoint,target,'--fetch-source-maps']],['listeners',['inspect-web-event-listeners',endpoint,target,'#quote']],['export-manifest',['export-web-scripts',path.join(run,'rea-evidence',mode+'-inspect.json'),path.join(run,'rea-evidence',mode+'-export')]],['js-analysis',['analyze-javascript-application',path.join(run,'rea-evidence',mode+'-export','files')]]])await command(mode+'-'+suffix,args);
  const pages=await (await fetch(endpoint+'/json/list')).json();pageClient=await cdp(pages.find(t=>t.id===target).webSocketDebuggerUrl);
  await command(mode+'-v8',['observe-web-execution',endpoint,target,'--observation-ms','10000'],async()=>{const {root:doc}=await pageClient.send('DOM.getDocument');const {nodeId}=await pageClient.send('DOM.querySelector',{nodeId:doc.nodeId,selector:'#quote'});const {model}=await pageClient.send('DOM.getBoxModel',{nodeId});const q=model.content;const x=(q[0]+q[4])/2,y=(q[1]+q[5])/2;await pageClient.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await pageClient.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});fs.writeFileSync(path.join(run,'logs',mode+'-armed-click.json'),JSON.stringify({at:new Date().toISOString(),method:'CDP native mouse dispatch after armed notification'}));});
 }finally{pageClient?.close();if(debuggerClient){await debuggerClient.send('Browser.close').catch(()=>{});debuggerClient.close();}else chrome?.kill();app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
}
console.log('Finished. Preserve raw limitations. This runner performs capture, not blind reconstruction.');
