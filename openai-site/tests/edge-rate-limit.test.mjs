import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {edgeRateLimitKey} from '../worker/rate-limit-key.mjs';
import {createApp,readConfig} from '../server/app.mjs';

const request=headers=>({get:name=>headers[name]});
test('Worker edge key is defined when the Node bridge has no socket IP',()=>{
  assert.equal(edgeRateLimitKey(request({'cf-connecting-ip':'192.0.2.10'})),'edge:192.0.2.10');
  assert.equal(edgeRateLimitKey(request({})),'edge:unavailable');
  assert.equal(edgeRateLimitKey(request({'cf-connecting-ip':'not an IP'})),'edge:unavailable');
});
test('IPv6 edge addresses share the configured subnet and arbitrary forwarding headers do not select a bucket',()=>{
  assert.equal(edgeRateLimitKey(request({'cf-connecting-ip':'2001:db8:1234:5600::1'})),edgeRateLimitKey(request({'cf-connecting-ip':'2001:db8:1234:56ff::2'})));
  assert.equal(edgeRateLimitKey(request({'x-forwarded-for':'192.0.2.1','x-real-ip':'192.0.2.2'})),'edge:unavailable');
  assert.equal(edgeRateLimitKey(request({'cf-connecting-ip':'192.0.2.1, 192.0.2.2'})),'edge:unavailable');
});
test('Worker limiter hook keeps search usable and login validation explicit without weakening origin checks',async()=>{
  const config=readConfig({APP_URL:'http://127.0.0.1:5173',SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'synthetic-test-key'});
  const app=createApp(config,{rateLimitKey:edgeRateLimitKey,opportunityService:{searchOpportunities:async()=>({jobs:[],source:{status:'live'}})}});
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const search=await fetch(base+'/api/career/search');assert.equal(search.status,200);assert(search.headers.get('ratelimit'));
    const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:config.appUrl,'Content-Type':'application/json'},body:'{}'});assert.equal(login.status,400);assert(login.headers.get('ratelimit'));
    const foreign=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:'https://foreign.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(foreign.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
