import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/LOCAL_USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const run=path.resolve('research/REA_Codex_Wargame_Kit/lab/runs/laptop-20261018-01');
for(const [mode,port] of [['unsafe',9222],['hardened',9223]]){
 const endpoint=`http://127.0.0.1:${port}`;
 const target=JSON.parse(fs.readFileSync(path.join(run,'rea-evidence',mode+'-targets.json'))).normalized_result.targets[0].target_id;
 const browser=await chromium.connectOverCDP(endpoint);
 const page=browser.contexts()[0].pages().find(p=>p.url().startsWith(`http://127.0.0.1:${mode==='unsafe'?3000:3001}`));
 const args=[path.resolve('tooling/node_modules/rea-agents/scripts/rea.mjs'),'observe-web-execution',endpoint,target,'--observation-ms','10000','--json'];
 const start=new Date().toISOString();const out=fs.openSync(path.join(run,'rea-evidence',mode+'-v8.json'),'w');
 const child=spawn(process.execPath,args,{stdio:['ignore',out,'pipe'],windowsHide:true});
 let stderr='',clicked=false,clickPromise;
 child.stderr.on('data',b=>{stderr+=b.toString();if(!clicked&&stderr.includes('observation armed;')){clicked=true;clickPromise=(async()=>{const at=new Date().toISOString();await page.locator('#quote').click();await page.waitForFunction(()=>document.querySelector('#result').textContent.length>0);fs.writeFileSync(path.join(run,'logs',mode+'-v8-action.json'),JSON.stringify({armedNotificationObserved:true,clickAt:at,result:await page.locator('#result').innerText()},null,2));})();}});
 const code=await new Promise(r=>child.on('exit',r));if(clickPromise)await clickPromise;
 fs.closeSync(out);fs.writeFileSync(path.join(run,'logs',mode+'-v8.stderr.txt'),stderr);
 fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify({start,end:new Date().toISOString(),executable:process.execPath,args,code,output:`rea-evidence/${mode}-v8.json`,armedClick:clicked})+'\n');
 console.log(JSON.stringify({mode,code,armedClick:clicked}));await browser.close();
}
