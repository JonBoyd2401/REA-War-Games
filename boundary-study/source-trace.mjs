import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),pkg=path.join(root,'node_modules/rea-agents');
const selected=[
 ['dist/browser/PlaywrightScenarioActions.js',['performPlaywrightScenarioAction','case "click"','case "fill"','case "wait_for"']],
 ['dist/browser/PlaywrightScenarioBrowser.js',['connectOverCDP']],
 ['dist/browser/CdpPageCapture.js',['Network.getResponseBody','DOMSnapshot.captureSnapshot','Accessibility.getFullAXTree']],
 ['dist/browser/CdpPageCaptureScripts.js',['include_script_sources','Debugger.getScriptSource']],
 ['dist/browser/WebSourceMapFetcher.js',['input.allowed_origins','credentials: "omit"','fetchFollowingApprovedRedirects']],
 ['dist/browser/network/PlaywrightScenarioNetwork.js',['response.source.body()']],
 ['dist/browser/BrowserScenarioPartialObservation.js',['Playwright response-body bytes']],
 ['dist/browser/assets/PublishWebScripts.js',['planWebScriptExport','Source-map']],
 ['dist/browser/execution/CdpEventListeners.js',['DOMDebugger.getEventListeners','execution: "unknown"']],
 ['dist/browser/execution/CdpExecutionCapture.js',['Profiler.startPreciseCoverage','Profiler.takePreciseCoverage','Profiler.stopPreciseCoverage','do not establish UI causality']],
 ['dist/domain/webBundleAnalyzerInspection.js',['parseJavaScriptSource','traverseJavaScriptAst']],
 ['dist/javascript/sourceMaps/TraceSourceMap.js',['sourcesContent-not-retained','sourcesContent text']]
];
const report={package:'rea-agents',version:JSON.parse(fs.readFileSync(path.join(pkg,'package.json'))).version,scope:'Inspection of installed npm distribution, not a claim about every upstream release',files:selected.map(([name,needles])=>{const bytes=fs.readFileSync(path.join(pkg,name)),lines=bytes.toString().split(/\r?\n/);return {path:name,sha256:createHash('sha256').update(bytes).digest('hex'),lineCount:lines.length,locations:needles.map(symbol=>({symbol,lines:lines.flatMap((line,i)=>line.includes(symbol)?[i+1]:[])}))};})};
if(report.version!=='6.7.0')throw Error('This source trace is pinned to 6.7.0');
process.stdout.write(JSON.stringify(report,null,2)+'\n');
