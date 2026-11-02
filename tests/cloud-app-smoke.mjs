// Explicit live integration runner. Uses temporary TEST accounts; never real student data.
// Supply JSON {users:[{email,password},{email,password}]} on stdin. Never prints credentials.
import 'dotenv/config';
import assert from 'node:assert/strict';
import {createApp,readConfig} from '../server/app.mjs';
import {SAMPLES} from '../src/lib/engine.js';
import {once} from 'node:events';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
let raw='';
console.log('Ready for temporary test credentials on hidden stdin.');
const input=await new Promise((resolve,reject)=>{process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{raw+=chunk;const end=raw.search(/[\r\n]/);if(end>=0)resolve(raw.slice(0,end));});process.stdin.on('error',reject);});
if(process.stdin.isTTY)process.stdin.setRawMode(false);
process.stdin.pause();
const {users}=JSON.parse(input);const config=readConfig();
assert.ok(config.supabaseUrl&&config.publishableKey,'Provider configuration required');
const server=createApp(config).listen(0,'127.0.0.1');await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
class Browser{cookies=new Map();async call(path,method='GET',body){const response=await fetch(base+'/api'+path,{method,headers:{'Origin':config.appUrl,...(body===undefined?{}:{'Content-Type':'application/json'}),'Cookie':[...this.cookies].map(([k,v])=>k+'='+v).join('; ')},...(body===undefined?{}:{body:JSON.stringify(body)})});for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0];const split=pair.indexOf('=');const name=pair.slice(0,split);const value=pair.slice(split+1);if(!value)this.cookies.delete(name);else this.cookies.set(name,value);assert.ok(cookie.toLowerCase().includes('httponly'),'Session cookies remain HttpOnly');}return {status:response.status,data:await response.json()};}}
const a=new Browser(),b=new Browser();
function good(response,status,label){assert.equal(response.status,status,label+': '+JSON.stringify(response.data));return response.data;}
const passed=[];function done(message){passed.push(message);console.log('PASS '+message);}
try{
 good(await a.call('/auth/login','POST',{email:users[0].email,password:'wrong-password'}),401,'Invalid password');done('Invalid credentials rejected');
 for(const [browser,u] of [[a,users[0]],[b,users[1]]])good(await browser.call('/auth/login','POST',u),200,'Provider login');
 // A retry may follow an interrupted run. These are dedicated, temporary test users only.
 assert.ok(users.every(u=>/^scamlens-test-[a-f0-9]+@example\.invalid$/.test(u.email)),'Use only dedicated synthetic accounts');
 for(const browser of [a,b]){const previous=good(await browser.call('/sessions'),200,'Read prior synthetic fixtures');for(const row of previous.sessions)good(await browser.call('/sessions/'+row.id,'DELETE',{}),200,'Clean prior synthetic fixture');}
 const meA=good(await a.call('/auth/me'),200,'Account A profile'),meB=good(await b.call('/auth/me'),200,'Account B profile');assert.notEqual(meA.user.id,meB.user.id);done('Two real provider logins, distinct profiles, HttpOnly session cookies');
 const sample=SAMPLES.find(s=>s.id==='scholarship');
 const first=good(await a.call('/sessions','POST',{input:sample.text,title:'Synthetic A cloud smoke'}),201,'Save A');
 const second=good(await b.call('/sessions','POST',{input:'Synthetic B private inspection',title:'Synthetic B cloud smoke'}),201,'Save B');
 good(await a.call('/sessions/'+second.id),404,'A cannot read B');good(await b.call('/sessions/'+first.id),404,'B cannot read A');done('Cross-account inspection IDs return 404 in both directions');
 const ai={summary:'Synthetic QA fixture, not model output.',uncertainties:['The sender is unverified.'],observations:[{quote:'Send your OTP',explanation:'This asks for a secret.'}]};
 const invalid=structuredClone(ai);invalid.observations[0].quote='absent evidence';good(await a.call('/sessions','POST',{input:sample.text,aiResponse:JSON.stringify(invalid)}),400,'Server rejects invented quote');
 const withAI=good(await a.call('/sessions','POST',{input:sample.text,aiResponse:JSON.stringify(ai),title:'Synthetic grounded AI fixture'}),201,'Save AI fixture');
 const detail=good(await a.call('/sessions/'+withAI.id),200,'Full history detail');assert.equal(detail.messages.length,4);assert.equal(detail.results.length,2);assert.ok(detail.messages.some(m=>m.role==='system'&&m.source==='chatgpt'));done('Server-side evidence validation and complete input/prompt/response/results persistence');
 good(await a.call('/settings','PATCH',{save_history:false}),200,'Disable saving');good(await a.call('/sessions','POST',{input:'Must not save'}),409,'Disabled saving enforced server side');good(await a.call('/settings','PATCH',{save_history:true}),200,'Reenable saving');done('History setting enforced server side');
 const profile=good(await a.call('/profile','PATCH',{name:'Temporary updated test A'}),200,'Profile update');assert.equal(profile.user.name,'Temporary updated test A');
 const exported=good(await a.call('/account/export'),200,'Complete export');assert.equal(exported.users.length,1);assert.equal(exported.sessions.length,2);assert.ok(exported.sessions.every(s=>s.user_id===meA.user.id));done('Own profile update and complete account export');
 good(await a.call('/auth/logout','POST',{}),200,'Logout');assert.equal(good(await a.call('/auth/me'),200,'Signed out').user,null);good(await a.call('/auth/login','POST',users[0]),200,'Returning login');assert.equal(good(await a.call('/sessions'),200,'Returning history').sessions.length,2);done('Logout and returning-user history restoration');
 good(await a.call('/account','DELETE',{password:'incorrect-password',confirmation:'DELETE'}),400,'Deletion reauthentication');good(await a.call('/auth/me'),200,'Account survives incorrect password');done('Incorrect password cannot delete the account');
 for(const [browser,u] of [[a,users[0]],[b,users[1]]]){good(await browser.call('/account','DELETE',{password:u.password,confirmation:'DELETE'}),200,'Verified account self-deletion');good(await browser.call('/auth/login','POST',u),401,'Deleted account cannot sign in');}
 done('Both temporary accounts self-deleted through deployed function; subsequent logins rejected');
 console.log(JSON.stringify({passed:passed.length,checks:passed,notice:'SQL-provisioned synthetic accounts; email signup/recovery delivery not tested.'}));
}finally{await new Promise(resolve=>server.close(resolve));}
