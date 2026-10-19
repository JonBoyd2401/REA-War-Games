import {readFile} from 'node:fs/promises';import {createOracle} from './server.mjs';
export function createGatedOracle({target}){
 const app=createOracle({target,policy:'estimate-plus-approved-quote'}),handler=app.server.listeners('request')[0];
 app.server.removeAllListeners('request');app.server.on('request',async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/probe.mjs'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await readFile(new URL('./gated-probe.mjs',import.meta.url)));return;}
  if(['/api/estimate','/api/quote-alias'].includes(route)){
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('study_session='))?.slice(14);
   const authenticated=app.tokens.includes(token);res.writeHead(authenticated?403:401,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:authenticated?'approved quote request required':'session required'}));return;
  }
  return handler(req,res);
 });return app;
}
