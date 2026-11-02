import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, buildPrompt, validateAI } from '../src/lib/engine.js';
import {createCareerRouter} from './career-routes.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailValid=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const passwordValid=value=>typeof value==='string'&&value.length>=12&&value.length<=128;
const nameValid=value=>typeof value==='string'&&value.trim().length>=1&&value.trim().length<=80;
const fail=(res,status,error)=>res.status(status).json({error});
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

export function readConfig(env=process.env){
  const appUrl=env.APP_URL||'http://127.0.0.1:5173';
  const url=new URL(appUrl);
  if(!['http:','https:'].includes(url.protocol)||url.pathname!=='/'||url.search||url.hash)throw new Error('APP_URL must be one app origin without a path.');
  const production=env.NODE_ENV==='production';
  if(production&&url.protocol!=='https:')throw new Error('Production APP_URL must use HTTPS.');
  return {appUrl:url.origin,supabaseUrl:env.SUPABASE_URL||'',publishableKey:env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY||'',serviceRoleKey:env.SUPABASE_SERVICE_ROLE_KEY||'',deleteFunction:env.SUPABASE_DELETE_FUNCTION||'',production,serveFrontend:production||env.SERVE_FRONTEND==='true',port:Number(env.PORT||3001)};
}

export function createApp(config=readConfig(), dependencies={}){
  const app=express();
  app.disable('x-powered-by');
  app.set('trust proxy',false);
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],fontSrc:["'self'"],imgSrc:["'self'",'data:'],connectSrc:config.production?["'self'"]:["'self'",'ws://localhost:5173','ws://127.0.0.1:5173'],objectSrc:["'none'"],frameAncestors:["'none'"],upgradeInsecureRequests:config.production?[]:null}},crossOriginEmbedderPolicy:false}));
  app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
  app.use(express.json({limit:'64kb',strict:true}));
  app.use(cookieParser());
  app.use('/api',(req,res,next)=>{
    if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
    if(req.get('origin')!==config.appUrl)return fail(res,403,'This request must come from the app’s own origin.');
    if(!req.is('application/json'))return fail(res,415,'Use application/json.');
    next();
  });
  const configured=Boolean(config.supabaseUrl&&config.publishableKey);
  const providerRequired=(req,res,next)=>configured?next():fail(res,503,'Account services are not configured. Continue as guest or set up Supabase.');
  const makeClient=dependencies.createServerClient||createServerClient;
  const client=(req,res)=>{
    if(req.supabase)return req.supabase;
    req.supabase=makeClient(config.supabaseUrl,config.publishableKey,{
      auth:{flowType:'pkce',autoRefreshToken:false,detectSessionInUrl:false},
      cookies:{
        getAll:()=>Object.entries(req.cookies||{}).map(([name,value])=>({name,value})),
        setAll:(cookies,headers={})=>{for(const [name,value] of Object.entries(headers))res.set(name,value);cookies.forEach(({name,value,options})=>{req.cookies[name]=value;res.cookie(name,value,{...options,...(options?.maxAge!==undefined?{maxAge:options.maxAge*1000}:{}),httpOnly:true,sameSite:'lax',secure:config.production,path:'/'});});}
      }
    });
    return req.supabase;
  };
  const authenticated=asyncRoute(async(req,res,next)=>{
    const {data,error}=await client(req,res).auth.getUser();
    if(error||!data.user)return fail(res,401,'Sign in to access your saved data.');
    req.user=data.user;next();
  });
  const authLimiter=rateLimit({windowMs:15*60*1000,limit:25,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many account requests. Try again in 15 minutes.'}});
  const writeLimiter=rateLimit({windowMs:60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many requests. Please wait a minute.'}});
  app.use('/api/career',createCareerRouter({client,authenticated,providerRequired,writeLimiter,service:dependencies.opportunityService}));
  app.get('/api/status',(_req,res)=>res.json({configured,deletionConfigured:configured&&Boolean(config.serviceRoleKey||config.deleteFunction)}));
  app.use('/api/auth',(req,res,next)=>req.method==='POST'?authLimiter(req,res,next):next());
  app.get('/api/auth/me',providerRequired,asyncRoute(async(req,res)=>{
    const sb=client(req,res);const {data,error}=await sb.auth.getUser();
    if(error||!data.user)return res.json({user:null});
    const [profile,settings]=await Promise.all([sb.from('users').select('id,name,email,created_at').eq('id',data.user.id).single(),sb.from('settings').select('save_history,theme,updated_at').eq('user_id',data.user.id).single()]);
    if(profile.error||settings.error)return fail(res,503,'Your account data is unavailable. Confirm that the database migration was applied.');
    res.json({user:{...profile.data,email:data.user.email},settings:settings.data});
  }));
  app.post('/api/auth/signup',providerRequired,asyncRoute(async(req,res)=>{
    const {name,email,password}=req.body||{};
    if(!nameValid(name)||!emailValid(email)||!passwordValid(password))return fail(res,400,'Enter a name, a valid email, and a password of 12–128 characters.');
    const {data,error}=await client(req,res).auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{name:name.trim()},emailRedirectTo:config.appUrl+'/api/auth/callback'}});
    if(error)return fail(res,400,'Could not create the account. Check your details and the provider’s email/password settings.');
    res.status(201).json({requiresConfirmation:!data.session,message:data.session?'Account created.':'Check your email to confirm your account. Open the link in this browser.'});
  }));
  app.post('/api/auth/login',providerRequired,asyncRoute(async(req,res)=>{
    const {email,password}=req.body||{};
    if(!emailValid(email)||typeof password!=='string'||password.length>128)return fail(res,400,'Enter your email and password.');
    const {error}=await client(req,res).auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    if(error)return fail(res,401,'Could not sign in. Check your credentials and confirm your email.');
    res.json({ok:true});
  }));
  app.post('/api/auth/logout',providerRequired,asyncRoute(async(req,res)=>{
    const {error}=await client(req,res).auth.signOut({scope:'local'});
    if(error)return fail(res,502,'Sign-out could not be confirmed. Please try again.');
    res.json({ok:true});
  }));
  app.post('/api/auth/forgot',providerRequired,asyncRoute(async(req,res)=>{
    const {email}=req.body||{};if(!emailValid(email))return fail(res,400,'Enter a valid email address.');
    const {error}=await client(req,res).auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:config.appUrl+'/api/auth/callback?flow=recovery'});
    if(error)return fail(res,502,'The recovery email could not be requested. Please try later.');
    res.json({message:'If this email has an account, a recovery link will arrive. Open it in this browser.'});
  }));
  app.get('/api/auth/callback',providerRequired,asyncRoute(async(req,res)=>{
    const code=req.query.code;
    if(typeof code!=='string'||code.length>2048)return res.redirect(config.appUrl+'/?authError=callback');
    const flowId=req.query.sb_flow_id;
    if(flowId!==undefined&&(typeof flowId!=='string'||! /^[A-Za-z0-9_-]{8,64}$/.test(flowId)))return res.redirect(config.appUrl+'/?authError=callback');
    const sb=client(req,res);const exchanged=await sb.auth.exchangeCodeForSession(code,flowId?{flowId}:undefined);
    if(exchanged.error)return res.redirect(config.appUrl+'/?authError=callback');
    const verified=await sb.auth.getUser();
    if(verified.error||!verified.data.user)return res.redirect(config.appUrl+'/?authError=callback');
    res.redirect(config.appUrl+(req.query.flow==='recovery'?'/?recovery=1':'/'));
  }));
  app.post('/api/auth/reset-password',providerRequired,authenticated,asyncRoute(async(req,res)=>{
    if(!passwordValid(req.body?.password))return fail(res,400,'Use a password of 12–128 characters.');
    const {error}=await client(req,res).auth.updateUser({password:req.body.password});
    if(error)return fail(res,400,'The password could not be updated. Request a fresh recovery link.');
    res.json({ok:true,message:'Password updated.'});
  }));
  app.use(['/api/sessions','/api/settings','/api/profile','/api/account'],providerRequired,authenticated,(req,res,next)=>['POST','PATCH','DELETE'].includes(req.method)?writeLimiter(req,res,next):next());
  app.get('/api/sessions',asyncRoute(async(req,res)=>{
    const offset=Math.max(0,Math.min(1000000,Number.parseInt(req.query.offset,10)||0));
    const limit=Math.max(1,Math.min(100,Number.parseInt(req.query.limit,10)||50));
    const {data,count,error}=await client(req,res).from('sessions').select('id,title,created_at,updated_at',{count:'exact'}).eq('user_id',req.user.id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+limit-1);
    if(error)return fail(res,502,'Could not load your history.');
    res.json({sessions:data,total:count,nextOffset:offset+data.length<(count||0)?offset+data.length:null});
  }));
  app.get('/api/sessions/:id',asyncRoute(async(req,res)=>{
    if(!UUID.test(req.params.id))return fail(res,400,'Invalid session ID.');
    const sb=client(req,res);const owner=req.user.id;const id=req.params.id;
    const session=await sb.from('sessions').select('*').eq('id',id).eq('user_id',owner).maybeSingle();
    if(session.error)return fail(res,502,'Could not load this inspection.');
    if(!session.data)return fail(res,404,'Inspection not found.');
    const [messages,results]=await Promise.all([sb.from('messages').select('*').eq('session_id',id).eq('user_id',owner).order('created_at'),sb.from('results').select('*').eq('session_id',id).eq('user_id',owner).order('created_at')]);
    if(messages.error||results.error)return fail(res,502,'Could not load the complete inspection.');
    res.json({session:session.data,messages:messages.data,results:results.data});
  }));
  app.post('/api/sessions',asyncRoute(async(req,res)=>{
    const {input,aiResponse,title}=req.body||{};
    if(typeof input!=='string'||!input.trim()||input.length>6000)return fail(res,400,'Use a message between 1 and 6,000 characters.');
    if(title!==undefined&&(typeof title!=='string'||title.length>100))return fail(res,400,'The title must be under 100 characters.');
    let ai=null;
    if(aiResponse!==undefined&&aiResponse!==''){
      const validated=validateAI(aiResponse,input);if(!validated.ok)return fail(res,400,validated.errors.join(' '));ai=validated.analysis;
    }
    const sb=client(req,res);const settings=await sb.from('settings').select('save_history').eq('user_id',req.user.id).single();
    if(settings.error)return fail(res,502,'Could not check your history preference.');
    if(!settings.data.save_history)return fail(res,409,'Saving is disabled in your settings. Turn it on before saving an inspection.');
    const local=analyze(input);
    const {data,error}=await sb.rpc('create_inspection_atomic',{p_input_text:input,p_title:title?.trim()||'Message inspection',p_local_result:local,p_ai_result:ai,p_ai_prompt:ai?buildPrompt(input):null});
    if(error)return fail(res,502,'Could not save this inspection. Please check the database migration and try again.');
    res.status(201).json({id:data,localResult:local,aiResult:ai});
  }));
  app.delete('/api/sessions/:id',asyncRoute(async(req,res)=>{
    if(!UUID.test(req.params.id))return fail(res,400,'Invalid session ID.');
    const {data,error}=await client(req,res).from('sessions').delete().eq('id',req.params.id).eq('user_id',req.user.id).select('id');
    if(error)return fail(res,502,'Could not remove this inspection.');
    if(!data.length)return fail(res,404,'Inspection not found.');
    res.json({ok:true});
  }));
  app.patch('/api/settings',asyncRoute(async(req,res)=>{
    if(typeof req.body?.save_history!=='boolean')return fail(res,400,'save_history must be true or false.');
    const {data,error}=await client(req,res).from('settings').update({save_history:req.body.save_history}).eq('user_id',req.user.id).select('save_history,theme,updated_at').single();
    if(error)return fail(res,502,'Could not update your settings.');res.json({settings:data});
  }));
  app.patch('/api/profile',asyncRoute(async(req,res)=>{
    if(!nameValid(req.body?.name))return fail(res,400,'Use a name of 1–80 characters.');
    const {data,error}=await client(req,res).from('users').update({name:req.body.name.trim()}).eq('id',req.user.id).select('id,name,email,created_at').single();
    if(error)return fail(res,502,'Could not update your profile.');res.json({user:data});
  }));
  async function allRows(sb,table,userId,key='user_id'){
    const all=[];for(let offset=0;;offset+=500){const {data,error}=await sb.from(table).select('*').eq(key,userId).order('created_at').order(['settings','career_profiles'].includes(table)?'user_id':'id').range(offset,offset+499);if(error)throw new Error('Export data unavailable');all.push(...data);if(data.length<500)break;}return all;
  }
  app.get('/api/account/export',asyncRoute(async(req,res)=>{
    const sb=client(req,res);const userId=req.user.id;
    const [users,sessions,messages,results,settings,career_profiles,opportunity_searches,saved_opportunities]=await Promise.all([allRows(sb,'users',userId,'id'),allRows(sb,'sessions',userId),allRows(sb,'messages',userId),allRows(sb,'results',userId),allRows(sb,'settings',userId),allRows(sb,'career_profiles',userId),allRows(sb,'opportunity_searches',userId),allRows(sb,'saved_opportunities',userId)]);
    res.set('Content-Disposition','attachment; filename="roleradar-my-data.json"');
    res.json({exported_at:new Date().toISOString(),users,sessions,messages,results,settings,career_profiles,opportunity_searches,saved_opportunities});
  }));
  app.delete('/api/account',asyncRoute(async(req,res)=>{
    if(!config.serviceRoleKey&&!config.deleteFunction)return fail(res,503,'Account deletion is not configured. No data was deleted.');
    if(req.body?.confirmation!=='DELETE'||typeof req.body?.password!=='string'||req.body.password.length>128)return fail(res,400,'Enter your password and type DELETE to confirm.');
    const sb=client(req,res);
    if(config.deleteFunction){
      // The authenticated Supabase client sends this verified caller's bearer token.
      // The Edge Function rechecks identity/password and owns the privileged key.
      const {data,error}=await sb.functions.invoke(config.deleteFunction,{body:{password:req.body.password,confirmation:'DELETE'}});
      if(error||data?.ok!==true)return fail(res,400,'Account deletion was not completed. Check your password and try again.');
    }else{
      const confirmation=await sb.auth.signInWithPassword({email:req.user.email,password:req.body.password});
      if(confirmation.error||confirmation.data.user?.id!==req.user.id)return fail(res,401,'Password confirmation failed. Nothing was deleted.');
      const admin=(dependencies.createClient||createClient)(config.supabaseUrl,config.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
      // Revoke sessions before deleting; old JWTs cannot read cascaded-away rows.
      const session=await sb.auth.getSession();
      if(session.error||!session.data.session?.access_token)return fail(res,401,'Session confirmation failed. Nothing was deleted.');
      const revoked=await admin.auth.admin.signOut(session.data.session.access_token,'global');
      if(revoked.error)return fail(res,502,'Session revocation failed. Nothing was deleted.');
      const {error}=await admin.auth.admin.deleteUser(req.user.id,false);
      if(error)return fail(res,502,'Account deletion was not completed. Please try again.');
    }
    // Supabase owns session lifecycle; cascade FKs remove all application rows.
    await sb.auth.signOut({scope:'local'}).catch(()=>{});
    for(const name of Object.keys(req.cookies||{}))if(name.startsWith('sb-'))res.clearCookie(name,{path:'/',httpOnly:true,sameSite:'lax',secure:config.production});
    res.json({ok:true});
  }));
  app.use('/api',(_req,res)=>fail(res,404,'API route not found.'));
  if(config.serveFrontend){const dist=fileURLToPath(new URL('../dist/',import.meta.url));app.use(express.static(dist,{index:false}));app.get('/{*path}',(_req,res)=>res.sendFile(path.join(dist,'index.html')));}
  app.use((error,_req,res,_next)=>{if(error?.type==='entity.too.large')return fail(res,413,'The request is too large.');if(error instanceof SyntaxError)return fail(res,400,'The request is not valid JSON.');fail(res,500,'The request could not be completed. No sensitive details are logged.');});
  return app;
}
