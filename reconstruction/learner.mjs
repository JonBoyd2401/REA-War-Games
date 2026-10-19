// Public attacker prior: exactly three non-increasing integer per-unit rates.
// This module receives only query responses; it imports no target or scoring code.
export function interval(row){
 const q=row.quantity,b=row.body;
 if(row.status!==200||!Number.isFinite(b.totalCents))return null;
 const half=(b.roundingCents||0)/2;
 return {q,lo:Math.max(0,Math.ceil((b.totalCents-half)/q)),hi:half?Math.ceil((b.totalCents+half)/q)-1:Math.round(b.totalCents/q),center:b.totalCents/q};
}
export function fit(rows){
 const samples=rows.map(interval).filter(Boolean).sort((a,b)=>a.q-b.q);
 // Intersection combines coarse and exact observations at the same quantity.
 const s=[];for(const r of samples){const last=s.at(-1);if(last?.q===r.q){last.lo=Math.max(last.lo,r.lo);last.hi=Math.min(last.hi,r.hi);last.center=(last.lo+last.hi)/2;}else s.push({...r});}
 if(!s.length)return {kind:'three-band',cuts:[334,667],rates:[2400,2200,2000],observations:0};
 const seg=Array.from({length:s.length},()=>[]);
 for(let a=0;a<s.length;a++)for(let b=a;b<s.length;b++){
  const g=s.slice(a,b+1),lo=Math.max(...g.map(x=>x.lo)),hi=Math.min(...g.map(x=>x.hi));
  const mean=g.reduce((v,x)=>v+x.center*x.q*x.q,0)/g.reduce((v,x)=>v+x.q*x.q,0);
  const rate=Math.max(0,Math.round(lo<=hi?Math.max(lo,Math.min(hi,mean)):mean));
  const loss=g.reduce((v,x)=>v+(Math.max(x.lo-rate,0,rate-x.hi)*x.q)**2,0);
  seg[a][b]={rate,loss};
 }
 let best=null;
 // Penalise no error-free model; tie-break towards wider observed support balance.
 for(let a=0;a<s.length;a++)for(let b=a;b<s.length;b++){
  const groups=[[0,a],...(a+1<=b?[[a+1,b]]:[]),...(b+1<s.length?[[b+1,s.length-1]]:[])];
  const rates=groups.map(([l,h])=>seg[l][h].rate);if(rates.some((v,i)=>i&&v>rates[i-1]))continue;
  const loss=groups.reduce((v,[l,h])=>v+seg[l][h].loss,0);
  const score=loss+groups.length*1e-7;
  if(!best||score<best.score){best={score,rates,cuts:groups.slice(0,-1).map(([,h])=>Math.floor((s[h].q+s[h+1].q)/2)+1)};}
 }
 return {kind:'three-band',cuts:best?.cuts||[],rates:best?.rates||[Math.round(s[0].center)],observations:s.length};
}
export function predict(model,q){let i=0;while(i<model.cuts.length&&q>=model.cuts[i])i++;return q*model.rates[i];}
function nextAdaptive(rows,seen){
 const s=rows.map(interval).filter(Boolean).sort((a,b)=>a.q-b.q);
 if(!seen.has(1))return 1;if(!seen.has(1000))return 1000;
 const gaps=[];for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i];if(b.q-a.q<=1)continue;const disjoint=a.lo>b.hi||b.lo>a.hi;gaps.push({q:Math.floor((a.q+b.q)/2),score:(disjoint?10000:0)+b.q-a.q});}
 gaps.sort((a,b)=>b.score-a.score||a.q-b.q);for(const g of gaps)if(!seen.has(g.q))return g.q;
 for(let q=1;q<=1000;q++)if(!seen.has(q))return q;return null;
}
export async function learn({policy,budget,method,query}){
 const rows=[],seen=new Set();
 async function ask(quantity,route='/api/estimate',requestId){const row=await query(quantity,route,requestId);rows.push(row);seen.add(quantity);return row;}
 if(policy==='estimate-plus-approved-quote')for(const [quantity,requestId]of [[50,'approved-50'],[200,'approved-200']])if(rows.length<budget)await ask(quantity,'/api/approved-quote',requestId);
 if(policy==='catalogue-only'){
  for(const quantity of [10,50,200,1000])if(rows.length<budget)await ask(quantity);
 }else{
  const remaining=budget-rows.length;
  for(let i=0;i<remaining;i++){
   let q=method==='adaptive'?nextAdaptive(rows,seen):Math.round(1+i*999/Math.max(1,remaining-1));
   if(q===null)break;const r=await ask(q);if(r.status===429)break;
  }
 }
 return {rows,model:fit(rows)};
}
