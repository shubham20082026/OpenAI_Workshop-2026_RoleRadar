import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createApp,readConfig} from '../server/app.mjs';

async function withServer(config,dependencies,run){
  const server=createApp(config,dependencies).listen(0,'127.0.0.1');await once(server,'listening');
  try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(resolve=>server.close(resolve));}
}
const origin='http://127.0.0.1:5173';
const offline=readConfig({APP_URL:origin});
const configured={...offline,supabaseUrl:'https://example.supabase.co',publishableKey:'TEST_PUBLIC_KEY'};

test('account status reports missing setup without exposing configuration values',()=>withServer(offline,{},async base=>{
  const response=await fetch(base+'/api/status');assert.equal(response.status,200);assert.deepEqual(await response.json(),{configured:false,deletionConfigured:false});assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(response.headers.get('content-security-policy'));
}));
test('unconfigured account operations fail explicitly, rather than simulate success',()=>withServer(offline,{},async base=>{
  const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'a@example.test',password:'not-a-real-password'})});assert.equal(response.status,503);assert.match((await response.json()).error,/not configured/);
}));
test('mutations reject missing or foreign origins before provider code runs',()=>withServer(configured,{createServerClient:()=>{throw new Error('Provider must not run');}},async base=>{
  for(const badOrigin of [undefined,'https://attacker.example']){const headers={'Content-Type':'application/json'};if(badOrigin)headers.Origin=badOrigin;const response=await fetch(base+'/api/auth/login',{method:'POST',headers,body:'{}'});assert.equal(response.status,403);}
}));
test('authentication is provider-verified for data routes',()=>withServer(configured,{createServerClient:()=>({auth:{getUser:async()=>({data:{user:null},error:new Error('No session')})}})},async base=>{
  for(const route of ['/api/sessions','/api/account/export']){const response=await fetch(base+route);assert.equal(response.status,401);assert.match((await response.json()).error,/Sign in/);}
}));
test('provider-managed cookies are HttpOnly and do not return tokens to the frontend',()=>withServer(configured,{createServerClient:(_url,_key,options)=>({auth:{signInWithPassword:async()=>{options.cookies.setAll([{name:'sb-test-auth-token',value:'SYNTHETIC_TEST_TOKEN',options:{maxAge:3600}}]);return {data:{user:{id:'test'}},error:null};}}})},async base=>{
  const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'a@example.test',password:'not-a-real-password'})});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);assert.match(cookie,/Path=\//i);assert.match(cookie,/Max-Age=3600(?:;|$)/i,'SSR seconds are converted to Express milliseconds without shortening session life');
}));
test('production configuration requires HTTPS and forbids path/redirect injection',()=>{
  assert.throws(()=>readConfig({NODE_ENV:'production',APP_URL:'http://example.test'}),/HTTPS/);assert.throws(()=>readConfig({APP_URL:'https://example.test/elsewhere'}),/origin/);assert.throws(()=>readConfig({APP_URL:'https://example.test/?return=https://elsewhere.test'}),/origin/);
});
test('built frontend can be served locally without weakening production HTTPS rules',()=>{
  assert.equal(readConfig({SERVE_FRONTEND:'true',APP_URL:'http://127.0.0.1:3001'}).serveFrontend,true);assert.equal(readConfig({APP_URL:origin}).serveFrontend,false);assert.equal(readConfig({NODE_ENV:'production',APP_URL:'https://example.test'}).serveFrontend,true);
});
test('malformed JSON is rejected without leaking server or provider internals',()=>withServer(offline,{},async base=>{
  const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{"password":'});assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'The request is not valid JSON.'});
}));
test('BFF invokes the configured deletion function with only password and confirmation',async()=>{
  const calls=[];const fake={auth:{getUser:async()=>({data:{user:{id:'verified-own-id',email:'own@example.test'}},error:null}),signOut:async()=>({error:null}),signInWithPassword:async()=>{throw new Error('Reauthentication belongs in Edge Function');}},functions:{invoke:async(name,options)=>{calls.push({name,...options});return {data:{ok:true},error:null};}}};
  await withServer({...configured,deleteFunction:'delete-scamlens-account'},{createServerClient:()=>fake,createClient:()=>{throw new Error('No local admin client needed');}},async base=>{
    const status=await fetch(base+'/api/status');assert.equal((await status.json()).deletionConfigured,true);
    const response=await fetch(base+'/api/account',{method:'DELETE',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({password:'test-only-password',confirmation:'DELETE',user_id:'victim'})});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.deepEqual(calls,[{name:'delete-scamlens-account',body:{password:'test-only-password',confirmation:'DELETE'}}]);
  });
});
