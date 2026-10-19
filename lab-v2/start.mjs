import {createSessionApp} from './server.mjs';
const passwordA=process.env.LAB_USER_A_PASSWORD,passwordB=process.env.LAB_USER_B_PASSWORD;
if(!passwordA||!passwordB)throw Error('Set synthetic LAB_USER_A_PASSWORD and LAB_USER_B_PASSWORD in the environment. Never reuse real credentials.');
const app=createSessionApp({accounts:[{username:'A',password:passwordA,tenant:'A'},{username:'B',password:passwordB,tenant:'B'}]});
app.server.listen(Number(process.env.PORT||3002),'127.0.0.1',()=>console.log(`Local session fixture at http://127.0.0.1:${app.server.address().port}. Sign in as A or B. Test-probe UI is disabled.`));
