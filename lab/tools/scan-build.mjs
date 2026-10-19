// Example CI client-artefact gate. Replace string patterns with reviewed product-specific rules.
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
const target=resolve(process.argv[2]||'public/hardened.js');
const paths=[];
async function walk(path){
  const s=await stat(path);
  if(s.isDirectory()) {for(const x of await readdir(path)) await walk(join(path,x));}
  else paths.push(path);
}
await walk(target);
const patterns=[/INTERNAL_PRICING_RULES/,/CORP_VOLUME_100/,/\bsourcesContent\b/,/sourceMappingURL/];
const failures=[];
for(const path of paths){
  if(path.endsWith('.map')){failures.push(`${path}: public source map`);continue;}
  if(!['.js','.mjs','.html','.json','.wasm'].includes(extname(path))) continue;
  const content=await readFile(path,'utf8');
  for(const p of patterns) if(p.test(content)) failures.push(`${path}: pattern ${p}`);
}
if(failures.length){console.error('FAIL: exposed client artefacts\n'+failures.join('\n'));process.exitCode=1;}
else console.log(`PASS: scanned ${paths.length} client artefact(s)`);
