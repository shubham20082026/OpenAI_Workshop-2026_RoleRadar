// Deliberately skipped without explicit test-account configuration.
// These tests create then remove synthetic rows in the configured Supabase project.
import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const env=process.env;
const ready=env.RUN_LIVE_AUTH_TESTS==='1'&&env.SUPABASE_URL&&(env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY)&&env.TEST_ACCOUNT_A_EMAIL&&env.TEST_ACCOUNT_A_PASSWORD&&env.TEST_ACCOUNT_B_EMAIL&&env.TEST_ACCOUNT_B_PASSWORD;
test('LIVE: two real accounts cannot read, forge ownership of, or cross-link one another’s data',{skip:!ready},async()=>{
  const options={auth:{persistSession:false,autoRefreshToken:false}};
  const key=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY;
  const a=createClient(env.SUPABASE_URL,key,options);const b=createClient(env.SUPABASE_URL,key,options);
  const loginA=await a.auth.signInWithPassword({email:env.TEST_ACCOUNT_A_EMAIL,password:env.TEST_ACCOUNT_A_PASSWORD});
  const loginB=await b.auth.signInWithPassword({email:env.TEST_ACCOUNT_B_EMAIL,password:env.TEST_ACCOUNT_B_PASSWORD});
  assert.equal(loginA.error,null,'Account A sign-in succeeds');assert.equal(loginB.error,null,'Account B sign-in succeeds');
  const aid=loginA.data.user.id,bid=loginB.data.user.id;assert.notEqual(aid,bid,'Use two different accounts');
  const ids=[];
  try{
    for(const [sb,uid,label] of [[a,aid,'A'],[b,bid,'B']]){
      const {data,error}=await sb.from('sessions').insert({user_id:uid,title:'Synthetic isolation test '+label,input_text:'TEST ONLY: '+crypto.randomUUID()}).select().single();assert.equal(error,null,'Owner can insert their row');ids.push(data.id);
    }
    const crossRead=await a.from('sessions').select('*').eq('id',ids[1]);assert.equal(crossRead.error,null);assert.deepEqual(crossRead.data,[],'A cannot read B even with exact ID');
    const reverse=await b.from('sessions').select('*').eq('id',ids[0]);assert.equal(reverse.error,null);assert.deepEqual(reverse.data,[],'B cannot read A');
    const forged=await a.from('sessions').insert({user_id:bid,title:'Forged owner',input_text:'Must fail'});assert.ok(forged.error,'A cannot insert as B');
    const crossMessage=await a.from('messages').insert({user_id:aid,session_id:ids[1],role:'user',source:'input',content:'Must fail'});assert.ok(crossMessage.error,'Composite FK prevents cross-owner message link');
    const crossResult=await a.from('results').insert({user_id:aid,session_id:ids[1],source:'local',payload:{test:true}});assert.ok(crossResult.error,'Composite FK prevents cross-owner result link');
    const updateOther=await a.from('users').update({name:'Should not change'}).eq('id',bid).select('id');assert.equal(updateOther.error,null);assert.deepEqual(updateOther.data,[],'A cannot edit B profile');
    const settings=await a.from('settings').select('*').eq('user_id',bid);assert.equal(settings.error,null);assert.deepEqual(settings.data,[],'A cannot read B settings');
    const deleteOther=await a.from('sessions').delete().eq('id',ids[1]).select('id');assert.equal(deleteOther.error,null);assert.deepEqual(deleteOther.data,[],'A cannot delete B inspection');
  }finally{
    if(ids[0])await a.from('sessions').delete().eq('id',ids[0]);
    if(ids[1])await b.from('sessions').delete().eq('id',ids[1]);
    await Promise.all([a.auth.signOut(),b.auth.signOut()]);
  }
});
