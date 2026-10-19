// Explicit test instrumentation; served only with testHarness=true. No account secret is embedded.
document.querySelector('#probe').addEventListener('click',async()=>{
 const rows=[];const id=document.querySelector('#otherquote').value;
 async function request(label,route,{body,headers={}}={}){const r=await fetch(route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-CSRF-Token':window.labCsrf,...headers},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}rows.push({label,status:r.status,body:data});}
 await request('other-tenant-quote','/api/quotes/'+id);
 await request('other-tenant-event','/api/events?quoteId='+id);
 await request('price-tamper','/api/quotes',{body:{productId:'widget',quantity:50,clientTotal:0.01}});
 await request('tenant-tamper','/api/quotes',{body:{productId:'widget',quantity:50,tenantId:'tenant-A'}});
 await request('missing-csrf','/api/quotes',{body:{productId:'widget',quantity:50},headers:{'X-CSRF-Token':''}});
 await request('public-demo-bearer','/api/quotes/'+id,{headers:{Authorization:'Bearer demo-A'}});
 await request('private-rules','/api/debug/rules');
 await request('source-map','/assets/app.js.map');
 document.querySelector('#probes').textContent=JSON.stringify(rows,null,2);
});
document.querySelector('#quota').addEventListener('click',async()=>{const rows=[];for(const quantity of [1,25,75,150,150]){const r=await fetch('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':window.labCsrf},body:JSON.stringify({productId:'widget',quantity})});rows.push({quantity,status:r.status,retryAfter:r.headers.get('Retry-After'),body:await r.json()});}document.querySelector('#probes').textContent=JSON.stringify(rows,null,2);});
