// UI code only. Accounts and passwords are provisioned server-side by the local test operator.
window.labCsrf='';
document.querySelector('#login').addEventListener('click',async()=>{
 const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.querySelector('#user').value,password:document.querySelector('#pass').value})});
 const b=await r.json();window.labCsrf=b.csrf||'';document.querySelector('#pass').value='';document.querySelector('#auth-state').textContent=String(r.status);
});
document.querySelector('#logout').addEventListener('click',async()=>{const r=await fetch('/api/logout',{method:'POST',headers:{'X-CSRF-Token':window.labCsrf}});window.labCsrf='';document.querySelector('#auth-state').textContent='signed out '+r.status;});
document.querySelector('#quote').addEventListener('click',async()=>{const r=await fetch('/api/quotes',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':window.labCsrf},body:JSON.stringify({productId:'widget',quantity:Number(document.querySelector('#quantity').value)})});document.querySelector('#result').textContent=JSON.stringify({status:r.status,body:await r.json()},null,2);});
