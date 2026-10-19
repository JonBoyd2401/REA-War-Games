#!/usr/bin/env node
/** Generate repeatable REA browser scenarios for the OWNED local fixture only. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browserExecutable = process.argv[2] ?? process.env.REA_BROWSER_EXECUTABLE;
const runId = process.argv[3] ?? 'local-first-run';
if (!browserExecutable || !path.isAbsolute(browserExecutable)) {
  console.error('Usage: node tools/generate-rea-scenarios.mjs <ABSOLUTE_CHROME_EXECUTABLE> [RUN_ID]');
  process.exit(2);
}
if (!/^[a-zA-Z0-9][\w.-]{0,70}$/.test(runId)) {
  console.error('RUN_ID must be an alphanumeric identifier (plus dots, hyphens or underscores).');
  process.exit(2);
}
if (!fs.existsSync(browserExecutable)) {
  console.error(`Browser binary not found: ${browserExecutable}`);
  process.exit(2);
}
const folder = path.join(root, 'runs', runId, 'scenarios');
fs.mkdirSync(folder, { recursive: true });
for (const [mode, port] of [['unsafe', 3000], ['hardened', 3001]]) {
  const scenario = {
    browser: { mode: 'launch', executable_path: browserExecutable, headless: true },
    start_url: { url: `http://127.0.0.1:${port}` },
    actions: [
      { step_id: 'quote-click', action: 'click', locator: { kind: 'css', selector: '#quote' }, timeout_ms: 10000 },
      { step_id: 'quote-rendered', action: 'wait_for', locator: { kind: 'css', selector: '#result:not(:empty)' }, state: 'visible', timeout_ms: 10000 }
    ],
    capture: {
      at_end: ['dom', 'accessibility', 'url'],
      events: ['network'],
      network: { request_body: true, response_body: true, header_values: false }
    }
  };
  const dest = path.join(folder, `${mode}-network.json`);
  fs.writeFileSync(dest, JSON.stringify(scenario, null, 2) + '\n');
  console.log(dest);
}
console.log('Note: request/response bodies are captured for this local synthetic fixture only.');
