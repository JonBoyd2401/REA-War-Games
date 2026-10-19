#!/usr/bin/env node
/** Provide input quantities only; never ship private pricing outputs to the red team. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runId = process.argv[2] ?? 'local-first-run';
if (!/^[a-zA-Z0-9][\w.-]{0,70}$/.test(runId)) {
  console.error('Invalid RUN_ID'); process.exit(2);
}
const quantities = [1,2,3,7,11,17,24,33,41,47,48,49,50,51,52,53,64,73,88,96,98,99,100,101,102,104,117,153,199,301,487,659,777,901,997,1000];
const dest = path.join(root, 'runs', runId, 'white_only', 'holdout-inputs.csv');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, 'quantity,predictedTotal\n' + quantities.map(q => `${q},`).join('\n') + '\n');
console.log(dest);
console.log(`${quantities.length} input quantities generated, with deliberately no ground-truth answers.`);
