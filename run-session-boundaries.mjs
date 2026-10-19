import fs from 'node:fs';import path from 'node:path';import {once} from 'node:events';import {spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';
import {createSessionApp} from './lab-v2/server.mjs';
const root=process.cwd(),run=path.join(root,'lab-v2/runs/session-boundaries-20261018');
const cli=path.join(root,fs.existsSync('node_modules/rea-agents/scripts/rea.mjs')?'node_modules/rea-agents/scripts/rea.mjs':'tooling/node_modules/rea-agents/scripts/rea.mjs');
const browser=process.env.REA_BROWSER_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe';
for(const d of ['rea-evidence','scenarios','logs'])fs.mkdirSync(path.join(run,d),{recursive:true});
const summary={label:'Server-enforced session boundaries exercised through REA; scripted tests, not adaptive autonomous attack',cases:[]};
const fill=(id,selector,value)=>({step_id:id,action:'fill',locator:{kind:'css',selector},value,timeout_ms:10000});
const literal=value=>({source:'literal',value});const click=(id,selector)=>({step_id:id,action:'click',locator:{kind:'css',selector},timeout_ms:10000});
const wait=(id,selector)=>({step_id:id,action:'wait_for',locator:{kind:'css',selector},state:'visible',timeout_ms:10000});
for(const name of ['anonymous','forged-cookie','revoked-cookie','tenant-B','viewer','owner','quota','wrong-password','logged-out']){
 const password=randomBytes(20).toString('hex');const accounts=[{username:'A',password,tenant:'A'},{username:'B',password,tenant:'B'},{username:'viewer',password,tenant:'A',permissions:['read']}];
 const app=createSessionApp({accounts,testHarness:true});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;
 try{
  let other='unknown',cookieToken;
  if(['anonymous','forged-cookie','revoked-cookie','tenant-B'].includes(name)){
   const r=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'A',password})});const auth=await r.json();const cookie=r.headers.get('set-cookie').split(';')[0];cookieToken=cookie.slice(12);
   const q=await fetch(base+'/api/quotes',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':auth.csrf,Cookie:cookie},body:JSON.stringify({productId:'widget',quantity:50})});other=(await q.json()).quoteId;
   if(name==='revoked-cookie')await fetch(base+'/api/logout',{method:'POST',headers:{'X-CSRF-Token':auth.csrf,Cookie:cookie}});
  }
  const actions=[],secrets=[],storage={cookies:[]};const env={...process.env};
  if(['tenant-B','viewer','owner','quota','wrong-password','logged-out'].includes(name)){
   env.REA_SESSION_TEST_PASSWORD=name==='wrong-password'?password+'-incorrect':password;secrets.push({secret_id:'testPassword',environment_variable:'REA_SESSION_TEST_PASSWORD'});
   actions.push(fill('user','#user',literal(name==='tenant-B'?'B':name==='viewer'?'viewer':'A')),fill('password','#pass',{source:'secret',secret_id:'testPassword'}),click('login','#login'),wait('login-finished','#auth-state:not(:empty)'));
  }
  if(name==='forged-cookie'||name==='revoked-cookie'){
   env.REA_SESSION_TEST_COOKIE=name==='forged-cookie'?'forged-synthetic-session':cookieToken;secrets.push({secret_id:'testCookie',environment_variable:'REA_SESSION_TEST_COOKIE'});
   storage.cookies.push({name:'rea_session',value:{source:'secret',secret_id:'testCookie'},destination:{url:base},http_only:true,secure:false,same_site:'Strict'});
  }
  if(['tenant-B','viewer','owner','logged-out'].includes(name))actions.push(click('normal-quote','#quote'),wait('quote-returned','#result:not(:empty)'));
  if(name==='logged-out')actions.push(click('logout','#logout'),wait('logged-out','#auth-state:text-is("signed out 200")'));
  if(name==='quota')actions.push(click('quota-probes','#quota'),wait('quota-result','#probes:not(:empty)'));
  else if(!['owner','viewer'].includes(name))actions.push(fill('other-id','#otherquote',literal(other)),click('boundary-probes','#probe'),wait('boundary-result','#probes:not(:empty)'));
  const scenario={browser:{mode:'launch',executable_path:browser,headless:true},start_url:{url:base},actions,secrets,storage,capture:{at_end:['dom','accessibility','url'],events:['network'],network:{request_body:true,response_body:true,header_values:false}}};
  const input=path.join(run,'scenarios',name+'.json');fs.writeFileSync(input,JSON.stringify(scenario,null,2));const output=path.join(run,'rea-evidence',name+'.json');const fd=fs.openSync(output,'wx'),err=fs.openSync(path.join(run,'logs',name+'.stderr.txt'),'w');const args=[cli,'capture-browser-scenario',input,'--json'];const start=new Date().toISOString();const p=spawn(process.execPath,args,{windowsHide:true,env,stdio:['ignore',fd,err]});const [code]=await once(p,'exit');fs.closeSync(fd);fs.closeSync(err);
  fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({name,start,end:new Date().toISOString(),args,code,secretValuesPersisted:false})+'\n');if(code!==0)throw Error(name+' REA failed');
  const raw=fs.readFileSync(output,'utf8');if(raw.includes(password)||cookieToken&&raw.includes(cookieToken))throw Error('Synthetic credential redaction failed: '+name);
  const n=JSON.parse(raw).normalized_result;const dom=n.steps.at(-1).artifacts.dom.value.text;const get=id=>{const t=dom.match(new RegExp('<pre id="'+id+'">([\\s\\S]*?)<\\/pre>'))?.[1];if(!t)return null;try{return JSON.parse(t.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'))}catch{return t}};
  const row={name,auth:get('auth-state'),quote:get('result'),probes:get('probes'),events:n.events.retained,completeness:n.completeness,serverEvents:app.getEvents()};summary.cases.push(row);console.log(JSON.stringify(row));
 }finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
}
fs.writeFileSync(path.join(run,'summary.json'),JSON.stringify(summary,null,2));
