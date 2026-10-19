import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
const run=path.resolve('research/REA_Codex_Wargame_Kit/lab/runs/laptop-20261018-01');
const read=n=>JSON.parse(fs.readFileSync(path.join(run,n),'utf8'));
const summaries={runId:'laptop-20261018-01',reaVersion:'6.7.0',modes:{}};
const observations=[];
function obs(id,mode,status,claim,file,jsonPath,limitation){observations.push({id,mode,status,claim,evidence:file,jsonPath,limitation});}
for(const mode of ['unsafe','hardened']){
 const prefix=`rea-evidence/${mode}`;
 const scenario=read(prefix+'-scenario.json').normalized_result;
 const inspect=read(prefix+'-inspect.json').normalized_result;
 const bundle=read(prefix+'-bundle-maps.json').normalized_result;
 const listeners=read(prefix+'-listeners.json').normalized_result;
 const v8=read(prefix+'-v8.json').normalized_result;
 const js=read(prefix+'-js-analysis.json').normalized_result;
 const bodies=scenario.events.items.map((e,index)=>({e,index})).filter(({e})=>e.kind==='network-content'&&e.body.state==='captured').map(({e,index})=>({index,sequence:e.sequence,phase:e.phase,transaction:e.transaction_id,text:Buffer.from(e.body.content,'base64').toString('utf8'),bytes:e.body.bytes}));
 const quote=bodies.find(b=>b.phase==='response'&&b.text.startsWith('{')&&b.text.includes('quoteId'));
 const quoteBody=JSON.parse(quote.text);
 const scripts=inspect.scripts.items;
 const source=scripts.map(s=>s.source.artifact.text).join('\n');
 const pricingPresent=source.includes('calculateInBrowser')&&source.includes('baseUnitPrice');
 summaries.modes[mode]={browser:scenario.browser.version,scenarioCompleteness:scenario.completeness,eventsRetained:scenario.events.retained,eventsDropped:scenario.events.dropped,scriptBytes:scripts.reduce((n,s)=>n+s.source.artifact.bytes,0),pricingPresent,quoteFields:Object.keys(quoteBody),quoteTotal:quoteBody.total,quoteBytes:quote.bytes,sourceMaps:bundle.observations.source_maps,listeners:listeners.listeners,applicationCoverage:v8.coverage.scripts.filter(s=>s.reported_url===`http://127.0.0.1:${mode==='unsafe'?3000:3001}/assets/app.js`),requests:v8.requests,staticStatistics:js.statistics};
 obs('R01',mode,pricingPresent?'OBSERVED':'NOT_OBSERVED_IN_CAPTURE',pricingPresent?'Full client pricing formula and 3 rule bands captured':'No pricing formula in captured application script',prefix+'-inspect.json','$.normalized_result.scripts.items[0].source.artifact.text','Only this fixture and capture; no general non-disclosure proof');
 obs('R02',mode,mode==='unsafe'?'OBSERVED':'NOT_OBSERVED_IN_CAPTURE',mode==='unsafe'?'Fetched 368-byte map with 257-byte embedded original source':'No declared source map fetched',prefix+'-bundle-maps.json','$.normalized_result.observations.source_maps','Unsafe map has empty mappings; embedded source is not full original application recovery');
 obs('R03',mode,'OBSERVED','Direct click listener associated with application script',prefix+'-listeners.json','$.normalized_result.listeners[0]','No delegated-listener census or UI causality proof');
 obs('R04',mode,'OBSERVED',mode==='unsafe'?'calculateInBrowser executed once; quote request initiator retained':'UI handler executed once; quote request initiator retained',prefix+'-v8.json','$.normalized_result.coverage.scripts[0]','10-second window; automation scripts also present; application URL filtered; causal_attribution unknown');
 obs('R05',mode,'OBSERVED',`Quote response has ${Object.keys(quoteBody).length} fields and ${quote.bytes} bytes`,prefix+'-scenario.json',`$.normalized_result.events.items[${quote.index}].body`,'Body content is base64; Playwright API bytes, not verified wire bytes; overall events incomplete');
 obs('R11',mode,'OBSERVED',`Quote for quantity 50 returned GBP ${quoteBody.total}`,prefix+'-scenario.json','$.normalized_result.steps[2].artifacts.dom.value.text','One UI flow; no accessibility, load, usability or latency study');
 obs('C01',mode,'UNKNOWN_INCOMPLETE','Scenario overall completeness is incomplete; events missing flag retained',prefix+'-scenario.json','$.normalized_result.completeness','Successful exit does not imply full evidence capture');
}
const api=read('white_only/api-controls.json');
for(const mode of ['unsafe','hardened']){
 for(const [i,c] of api.modes[mode].controls.entries())obs('A'+String(i+1).padStart(2,'0'),mode,c.status>=400?'CONTROL_PREVENTED':'OBSERVED',`${c.label}: HTTP ${c.status}`,'white_only/api-controls.json',`$.modes.${mode}.controls[${i}]`,'Supplemental direct HTTP measurement, NOT REA; fresh fixtures per experimental condition');
 obs('R09',mode,'OBSERVED','Four equal-policy ordinary samples retain observable totals','white_only/api-controls.json',`$.modes.${mode}.samples`,'White-team illustration; not blind inference; cannot establish exact thresholds from sparse samples');
 obs('R10',mode,'UNKNOWN_INCOMPLETE','Independent blind reconstruction not performed','','','Same session observed both variants and white-team source; no valid holdout score');
 obs('R12',mode,'HYPOTHESIS_ONLY','Decoy effect not tested','','','Requires independent repeated randomised agent sessions');
}
obs('R08','hardened','CONTROL_PREVENTED','Fifth consecutive ordinary quote attempt returned HTTP 429','white_only/api-controls.json','$.modes.hardened.fifth','Four-per-minute single-node quota; no distributed or long-term inference conclusion');
fs.writeFileSync(path.join(run,'results-summary.json'),JSON.stringify(summaries,null,2));
fs.writeFileSync(path.join(run,'observations.csv'),Object.keys(observations[0]).join(',')+'\n'+observations.map(r=>Object.values(r).map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')+'\n');
const env={platform:os.platform(),release:os.release(),architecture:os.arch(),cpu:os.cpus()[0].model,logicalProcessors:os.cpus().length,memoryGiB:Math.round(os.totalmem()/2**30),node:process.version,rea:'6.7.0',packageManager:'pnpm 11.25.0',npm:'unavailable',browser:'Chrome 155.0.8059.82',browserPath:'C:/Program Files/Google/Chrome/Application/chrome.exe',codexModel:'GPT-6 family per session instructions; exact configured model and reasoning effort unavailable',timezone:'Europe/London',runId:summaries.runId,scope:'owned localhost synthetic fixtures only',blindReconstruction:false};
fs.writeFileSync(path.join(run,'environment.json'),JSON.stringify(env,null,2));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=['server.mjs','private-pricing.mjs','public/unsafe.js','public/unsafe.js.map','public/hardened.js','package.json','test/wargame.test.mjs'];
fs.writeFileSync(path.join(run,'baseline-sha256.json'),JSON.stringify(Object.fromEntries(baseline.map(f=>[f,digest(path.join(run,'../..',f))])),null,2));
console.log(JSON.stringify({reaCommands:fs.readFileSync(path.join(run,'commands.jsonl'),'utf8').trim().split('\n').length,observations:observations.length,environment:env,summary:Object.fromEntries(Object.entries(summaries.modes).map(([m,v])=>[m,{pricingPresent:v.pricingPresent,quoteFields:v.quoteFields,quoteBytes:v.quoteBytes}]))},null,2));
