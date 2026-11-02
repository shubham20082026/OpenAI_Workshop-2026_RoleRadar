// Pure handler with dependency injection so security behavior can be tested locally.
// No CORS headers: this is called by the same-origin backend, never a browser SDK.
const respond=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function keyFromDictionary(raw){try{const keys=JSON.parse(raw||'{}');return typeof keys.default==='string'?keys.default:'';}catch{return '';}}
async function boundedJSON(request){
  if(Number(request.headers.get('content-length'))>2048)throw new RangeError('size');
  const reader=request.body?.getReader();if(!reader)throw new SyntaxError('empty');
  const chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new RangeError('size');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let position=0;for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.byteLength;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export function createDeleteHandler({createClient,env}){
  return async request=>{
    if(request.method!=='POST')return new Response(JSON.stringify({error:'Use POST.'}),{status:405,headers:{'Content-Type':'application/json','Allow':'POST','Cache-Control':'no-store'}});
    if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||''))return respond(415,{error:'Use application/json.'});
    const bearer=request.headers.get('authorization')?.match(/^Bearer ([^\s]{20,8192})$/i)?.[1];
    if(!bearer)return respond(401,{error:'Authentication required.'});
    const url=env.SUPABASE_URL;
    const publicKey=keyFromDictionary(env.SUPABASE_PUBLISHABLE_KEYS)||env.SUPABASE_ANON_KEY;
    const secretKey=keyFromDictionary(env.SUPABASE_SECRET_KEYS)||env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!publicKey||!secretKey)return respond(503,{error:'Account deletion is not configured.'});
    try{
      let body;try{body=await boundedJSON(request);}catch(error){return respond(error instanceof RangeError?413:400,{error:error instanceof RangeError?'Request is too large.':'Invalid JSON.'});}
      if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).some(key=>!['password','confirmation'].includes(key))||body.confirmation!=='DELETE'||typeof body.password!=='string'||!body.password.length||body.password.length>128)return respond(400,{error:'Enter your password and type DELETE. No user ID is accepted.'});
      const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
      const caller=createClient(url,publicKey,options);
      // getUser contacts Auth: never trust a decoded JWT or request-supplied ID.
      const verified=await caller.auth.getUser(bearer);
      const user=verified.data?.user;
      if(verified.error||!user?.id||!user.email)return respond(401,{error:'Authentication required.'});
      const reauthenticated=await caller.auth.signInWithPassword({email:user.email,password:body.password});
      if(reauthenticated.error||reauthenticated.data?.user?.id!==user.id)return respond(401,{error:'Password confirmation failed. Nothing was deleted.'});
      const admin=createClient(url,secretKey,options);
      // Revocation first is defense in depth; JWTs can otherwise outlive deletion.
      // All application rows disappear via foreign-key cascades on auth.users.
      const revoked=await admin.auth.admin.signOut(bearer,'global');
      if(revoked.error)return respond(502,{error:'Session revocation failed. Nothing was deleted.'});
      const deleted=await admin.auth.admin.deleteUser(user.id,false);
      if(deleted.error)return respond(502,{error:'Account deletion was not completed.'});
      return respond(200,{ok:true});
    }catch{return respond(500,{error:'Account deletion could not be completed.'});}
  };
}
