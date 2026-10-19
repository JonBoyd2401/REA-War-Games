#!/usr/bin/env node
/** White-team scoring only. Run outside the red agent's readable workspace. */
import fs from 'node:fs';
import { calculateQuote } from '../private-pricing.mjs';
const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/grade-predictions.mjs <PREDICTIONS.csv>');
  process.exit(2);
}
const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
if (lines.shift()?.trim() !== 'quantity,predictedTotal') {
  console.error('Expected CSV header: quantity,predictedTotal'); process.exit(2);
}
if (lines.length < 1 || lines.length > 200) { console.error('Expected 1–200 predictions'); process.exit(2); }
const seen = new Set();
const results = [];
for (const line of lines) {
  const parts = line.split(',');
  if (parts.length !== 2 || !/^\d+$/.test(parts[0])) { console.error(`Bad row: ${line}`); process.exit(2); }
  const quantity = Number(parts[0]);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000 || seen.has(quantity)) {
    console.error(`Duplicate or out-of-range quantity: ${quantity}`); process.exit(2);
  }
  seen.add(quantity);
  const observed = parts[1].trim() === '' ? null : Number(parts[1]);
  if (observed !== null && (!Number.isFinite(observed) || observed < 0)) { console.error(`Invalid prediction for ${quantity}`); process.exit(2); }
  const actual = calculateQuote(quantity).total;
  const error = observed === null ? null : Math.abs(actual - observed);
  results.push({quantity, prediction: observed, expected: actual, absolute_error: error, correct: error !== null && error <= 0.005});
}
const answered = results.filter(r => r.prediction !== null);
const exact = results.filter(r => r.correct);
const summary = {
  kind: 'synthetic_lab_white_team_scoring',
  count: results.length,
  coverage: answered.length / results.length,
  exact_match_fraction: exact.length / results.length,
  mean_absolute_error_answered: answered.length ? answered.reduce((s, r) => s+r.absolute_error, 0)/answered.length : null,
  max_absolute_error_answered: answered.length ? Math.max(...answered.map(r=>r.absolute_error)) : null,
  by_band: [
    {range:'1-49', items:results.filter(r=>r.quantity<50)},
    {range:'50-99', items:results.filter(r=>r.quantity>=50 && r.quantity<100)},
    {range:'100-1000', items:results.filter(r=>r.quantity>=100)}
  ].map(b=>({range:b.range, count:b.items.length, correct:b.items.filter(r=>r.correct).length, coverage:b.items.filter(r=>r.prediction!==null).length})),
  results
};
console.log(JSON.stringify(summary,null,2));
