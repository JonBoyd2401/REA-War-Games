import {learn} from './learner.mjs';
document.querySelector('#run').addEventListener('click',async()=>{
 const context=await(await fetch('/api/context')).json();
 const learned=await learn({...context,query:async(quantity,route,requestId)=>{
  const r=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(requestId?{requestId}:{quantity})});
  return {quantity,route,status:r.status,body:await r.json()};
 }});
 document.querySelector('#result').textContent=JSON.stringify(learned);
});
