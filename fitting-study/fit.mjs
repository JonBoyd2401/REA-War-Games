// Generic bounded numerical fitting. No target source, file access or code execution.
export function observations(records){
 const map=new Map();
 for(const record of records)for(const row of record.result.rows){
  if(row.status!==200)continue;
  const y=row.body.totalCents,r=row.body.quantizationRatio||1;
  const lo=r===1?y-.499999:(y-.5)/Math.sqrt(r),hi=r===1?y+.499999:(y+.5)*Math.sqrt(r);
  const old=map.get(row.quantity);
  map.set(row.quantity,{x:row.quantity,y,lo:old?Math.max(old.lo,lo):lo,hi:old?Math.min(old.hi,hi):hi});
 }
 return [...map.values()].sort((a,b)=>a.x-b.x).map(p=>({...p,y:(p.lo+p.hi)/2}));
}
function line(points,origin=false){
 let sw=0,sx=0,sy=0,sxx=0,sxy=0;
 for(const p of points){const w=1/Math.max(1,p.y)**2;sw+=w;sx+=w*p.x;sy+=w*p.y;sxx+=w*p.x*p.x;sxy+=w*p.x*p.y;}
 const d=sw*sxx-sx*sx,m=origin?sxy/sxx:Math.abs(d)>1e-30?(sw*sxy-sx*sy)/d:0,b=origin?0:(sy-m*sx)/sw;
 return {constant:b,linear:m,quadratic:0};
}
function clip(poly,a,b,c){
 const result=[];
 for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],vp=a*p[0]+b*p[1]-c,vq=a*q[0]+b*q[1]-c;
  if(vp<=1e-7)result.push(p);
  if((vp<0&&vq>0)||(vp>0&&vq<0)){const t=vp/(vp-vq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
 }
 return result;
}
function intervalLine(points,origin){
 let poly=[[-1e7,-1e6],[1e7,-1e6],[1e7,1e6],[-1e7,1e6]];
 if(origin){poly=clip(poly,1,0,0);poly=clip(poly,-1,0,0);}
 for(const p of points){poly=clip(poly,1,p.x,p.hi);poly=clip(poly,-1,-p.x,-p.lo);if(!poly.length)return null;}
 const b=poly.reduce((s,p)=>s+p[0],0)/poly.length,m=poly.reduce((s,p)=>s+p[1],0)/poly.length;
 // Generic candidate simplification: prefer nearby integer coefficients if feasible.
 const candidates=[[Math.round(b),Math.round(m)],[b,m]];
 const chosen=candidates.find(([a,c])=>points.every(p=>a+c*p.x>=p.lo-1e-6&&a+c*p.x<=p.hi+1e-6))||[b,m];
 return {constant:chosen[0],linear:chosen[1],quadratic:0,coefficientBounds:{constant:[Math.min(...poly.map(p=>p[0])),Math.max(...poly.map(p=>p[0]))],linear:[Math.min(...poly.map(p=>p[1])),Math.max(...poly.map(p=>p[1]))]}};
}
function error(points,s,interval=false){return points.reduce((sum,p)=>{const v=s.constant+s.linear*p.x,e=interval?Math.max(0,p.lo-v,v-p.hi):v-p.y;return sum+(e/Math.max(1,p.y))**2;},0);}
export function numericalFit(records,args={}){
 const points=observations(records),n=points.length,kmax=args.maxSegments??5,min=args.minPoints??2,mode=args.mode??'interval',origin=args.origin??false;
 if(!Number.isInteger(kmax)||kmax<1||kmax>8||!Number.isInteger(min)||min<2||min>8||!['interval','leastSquares'].includes(mode)||typeof origin!=='boolean'||Object.keys(args).some(k=>!['maxSegments','minPoints','mode','origin','starts'].includes(k)))return {error:'Invalid fitting options'};
 if(n<min)return {error:'Too few distinct successful observations',distinctObservations:n};
 function fitPart(a,b){const p=points.slice(a,b),ols=line(p,origin),iv=mode==='interval'?intervalLine(p,origin):null,s=iv||ols;return {s,error:error(p,s,mode==='interval'),feasible:!!iv,range:[p[0].x,p.at(-1).x]};}
 function output(parts,starts){const segments=parts.map((p,i)=>({from:starts[i],constant:p.s.constant,linear:p.s.linear,quadratic:0}));return {predictor:{segments,notes:'Numerical candidate; agent must assess transition uncertainty.'},squaredRelativeLoss:parts.reduce((s,p)=>s+p.error,0),parts:parts.map(p=>({observedRange:p.range,intervalFeasible:p.feasible,coefficientBounds:p.s.coefficientBounds||null})),boundaryGaps:parts.slice(1).map((p,i)=>[parts[i].range[1]+1,p.range[0]])};}
 if(args.starts){const starts=args.starts;if(!Array.isArray(starts)||starts.length>8||starts[0]!==1||starts.some((x,i)=>!Number.isInteger(x)||x<1||x>1000||(i&&x<=starts[i-1])))return {error:'Invalid starts'};
  const parts=[];for(let i=0;i<starts.length;i++){const a=points.findIndex(p=>p.x>=starts[i]),end=points.findIndex(p=>p.x>=(starts[i+1]||1001)),b=end<0?n:end;if(a<0||b-a<min)return {error:'Too few points in a requested segment'};parts.push(fitPart(a,b));}return {distinctObservations:n,mode,candidates:[output(parts,starts)]};}
 // Dynamic programming chooses partitions on weighted least-squares cost. Interval
 // constraints then refine each chosen part; this is not global interval optimisation.
 const costs=Array.from({length:n},()=>Array(n+1));
 for(let a=0;a<n;a++)for(let b=a+min;b<=n;b++){const p=points.slice(a,b);costs[a][b]=error(p,line(p,origin));}
 const dp=Array.from({length:kmax+1},()=>Array(n+1).fill(Infinity)),prev=Array.from({length:kmax+1},()=>Array(n+1).fill(-1));dp[0][0]=0;
 for(let k=1;k<=kmax;k++)for(let b=k*min;b<=n;b++)for(let a=(k-1)*min;a<=b-min;a++){const v=dp[k-1][a]+costs[a][b];if(v<dp[k][b]){dp[k][b]=v;prev[k][b]=a;}}
 const candidates=[];
 for(let k=1;k<=kmax;k++)if(Number.isFinite(dp[k][n])){let b=n,parts=[];for(let j=k;j>0;j--){const a=prev[j][b];parts.unshift(fitPart(a,b));b=a;}const starts=parts.map((p,i)=>i?Math.floor((parts[i-1].range[1]+p.range[0])/2)+1:1);candidates.push(output(parts,starts));}
 return {distinctObservations:n,mode,candidates,warning:'Training fit is not held-out accuracy. Boundary gaps need adaptive probes. Only observed outputs are used.'};
}
