import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const run=path.resolve('research/REA_Codex_Wargame_Kit/lab/runs/laptop-20261018-01');
async function rea(name,args){await new Promise((resolve)=>{const p=spawn(process.execPath,['run-rea.mjs',name,...args],{stdio:'inherit',windowsHide:true});p.on('exit',resolve);});}
for(const [mode,port] of [['unsafe',9222],['hardened',9223]]){
 const endpoint=`http://127.0.0.1:${port}`;
 const j=JSON.parse(fs.readFileSync(path.join(run,'rea-evidence',mode+'-targets.json')));
 const target=j.normalized_result.targets[0].target_id;
 await rea(mode+'-inspect',['inspect-web-page',endpoint,target,'--include-script-sources','--include-json-body-shapes','--include-accessibility-text']);
 await rea(mode+'-bundle',['analyze-web-bundle',endpoint,target]);
 await rea(mode+'-bundle-maps',['analyze-web-bundle',endpoint,target,'--fetch-source-maps']);
 await rea(mode+'-listeners',['inspect-web-event-listeners',endpoint,target,'#quote']);
 await rea(mode+'-export-manifest',['export-web-scripts',path.join(run,'rea-evidence',mode+'-inspect.json'),path.join(run,'rea-evidence',mode+'-export')]);
 await rea(mode+'-js-analysis',['analyze-javascript-application',path.join(run,'rea-evidence',mode+'-export','files')]);
}
