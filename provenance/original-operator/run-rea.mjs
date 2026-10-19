import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd();
const run=path.resolve('research/REA_Codex_Wargame_Kit/lab/runs/laptop-20261018-01');
const cli=path.resolve('tooling/node_modules/rea-agents/scripts/rea.mjs');
const [name,...args]=process.argv.slice(2);
if(!name||!args.length)throw Error('Usage: node run-rea.mjs evidence-name REA-command args');
const out=fs.openSync(path.join(run,'rea-evidence',name+'.json'),'w');
const err=fs.openSync(path.join(run,'logs',name+'.stderr.txt'),'w');
const start=new Date().toISOString();
const child=spawn(process.execPath,[cli,...args,'--json'],{cwd:root,stdio:['ignore',out,err],windowsHide:true});
const timer=setTimeout(()=>child.kill(),120000);
child.on('exit',(code,signal)=>{
 clearTimeout(timer);fs.closeSync(out);fs.closeSync(err);
 const rec={start,end:new Date().toISOString(),executable:process.execPath,args:[cli,...args,'--json'],cwd:root,code,signal,output:`rea-evidence/${name}.json`};
 fs.appendFileSync(path.join(run,'commands.jsonl'),JSON.stringify(rec)+'\n');
 let summary;try{const j=JSON.parse(fs.readFileSync(path.join(run,'rea-evidence',name+'.json'),'utf8'));summary={keys:Object.keys(j),status:j.status,error:j.error};}catch(e){summary={parseError:e.message};}
 console.log(JSON.stringify({name,code,signal,...summary}));process.exitCode=code??1;
});
