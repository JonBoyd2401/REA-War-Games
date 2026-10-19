import {fit} from './learner.mjs';
document.querySelector('#run').addEventListener('click',async()=>{
 const rows=[];for(const [quantity,route,body]of [[50,'/api/approved-quote',{requestId:'approved-50'}],[200,'/api/approved-quote',{requestId:'approved-200'}],[1,'/api/estimate',{quantity:1}],[1000,'/api/quote-alias',{quantity:1000}]]){
  const r=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});rows.push({quantity,route,status:r.status,body:await r.json()});
 }
 document.querySelector('#result').textContent=JSON.stringify({rows,model:fit(rows)});
});
