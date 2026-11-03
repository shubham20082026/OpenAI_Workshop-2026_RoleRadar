import {createHash} from 'node:crypto';
import {createOpportunityService} from './opportunities.mjs';

const DAY=86_400_000;
const JOB_ID=/^himalayas-[a-f0-9]{24}$/;
const MAX_PAYLOAD=80_000;
const CATALOG_ERROR='The shared public catalog is unavailable. Please try again; no role was saved.';

function catalogError(){const error=new Error(CATALOG_ERROR);error.code='PUBLIC_CATALOG_UNAVAILABLE';error.status=503;return error;}
function text(value,max){return typeof value==='string'&&value.length>0&&value.length<=max;}
function timestamp(value){if(typeof value!=='string')return null;const result=Date.parse(value);return Number.isFinite(result)?result:null;}
function sourceURL(value){try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='himalayas.app'&&!url.username&&!url.password&&url.pathname.startsWith('/companies/');}catch{return false;}}
function stringList(value,max){return Array.isArray(value)&&value.length<=max&&value.every(item=>text(item,100));}

// This projection is deliberately independent of user-selected skills/ranking.
// Only source-normalized public listing fields are ever persisted in D1.
function canonicalJob(value,now){
  if(!value||typeof value!=='object'||Array.isArray(value)||!JOB_ID.test(value.id||''))return null;
  if(value.source!=='Himalayas'||value.sourceUrl!=='https://himalayas.app'||value.remote!==true)return null;
  if(!sourceURL(value.guid)||!sourceURL(value.applyUrl))return null;
  if(value.id!=='himalayas-'+createHash('sha256').update(value.guid).digest('hex').slice(0,24))return null;
  if(!text(value.title,200)||!text(value.company,150)||!text(value.location,5100)||!text(value.employmentType,100))return null;
  if(typeof value.descriptionPlain!=='string'||value.descriptionPlain.length>24000||!text(value.eligibilityNote,1000))return null;
  if(value.countries!==null&&!stringList(value.countries,50))return null;
  if(!stringList(value.seniority,20))return null;
  const retrievedAt=timestamp(value.retrievedAt);
  const expiresAt=value.expiresAt===null?null:timestamp(value.expiresAt);
  const sourceUpdatedAt=value.sourceUpdatedAt===null?null:timestamp(value.sourceUpdatedAt);
  if(retrievedAt===null||retrievedAt>now+60_000||retrievedAt+DAY<=now)return null;
  if(value.expiresAt!==null&&(expiresAt===null||expiresAt<=now))return null;
  if(value.sourceUpdatedAt!==null&&sourceUpdatedAt===null)return null;
  let salary=null;
  if(value.salary!==null){
    const input=value.salary;
    if(!input||typeof input!=='object'||!text(input.currency,30)||!text(input.period,50))return null;
    for(const amount of [input.min,input.max])if(amount!==null&&(!Number.isFinite(amount)||amount<0))return null;
    salary={min:input.min,max:input.max,currency:input.currency,period:input.period};
  }
  return {id:value.id,title:value.title,company:value.company,location:value.location,countries:value.countries,
    remote:true,employmentType:value.employmentType,seniority:value.seniority,source:'Himalayas',sourceUrl:'https://himalayas.app',
    applyUrl:value.applyUrl,guid:value.guid,descriptionPlain:value.descriptionPlain,sourceUpdatedAt:value.sourceUpdatedAt,
    expiresAt:value.expiresAt,salary,eligibilityNote:value.eligibilityNote,retrievedAt:value.retrievedAt};
}

export function createHostedOpportunityService({db,apiKey='',fetchImpl=fetch,clock=Date.now}={}){
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')throw new TypeError('A D1 public-catalog binding is required.');
  const source=createOpportunityService({apiKey,fetchImpl,clock});
  const read=async id=>{
    if(typeof id!=='string'||!JOB_ID.test(id))return null;
    try{return await db.prepare('SELECT job_id, payload, expires_at, closed_until FROM public_job_catalog WHERE job_id = ?').bind(id).first();}
    catch{throw catalogError();}
  };
  function decode(row,now){
    if(!row||!Number.isSafeInteger(row.expires_at)||row.expires_at<=now||!Number.isSafeInteger(row.closed_until)||row.closed_until>now)return null;
    if(typeof row.payload!=='string'||row.payload.length>MAX_PAYLOAD)return null;
    try{const job=canonicalJob(JSON.parse(row.payload),now);return job&&job.id===row.job_id?job:null;}catch{return null;}
  }
  async function getKnownJob(id){
    // Always consult the durable record, even on a warm isolate: another isolate
    // may have learned that this listing closed since our previous request.
    const job=decode(await read(id),clock());
    if(job)source.hydrateKnownJob(job);
    return job;
  }
  async function searchOpportunities(input){
    const result=await source.searchOpportunities(input);
    const now=clock();
    const candidates=result.jobs.map(job=>{
      const publicJob=canonicalJob(job,now);
      const payload=publicJob?JSON.stringify(publicJob):'';
      return {ranked:job,public:publicJob,payload};
    });
    // Source records are independent: one malformed listing or a page crossing
    // its freshness window must not discard other usable source evidence.
    const jobs=candidates.filter(job=>job.public&&job.payload.length<=MAX_PAYLOAD);
    const skipped=candidates.length-jobs.length;
    const statements=jobs.map(({public:job,payload})=>{
      const expires=Math.min(timestamp(job.retrievedAt)+DAY,job.expiresAt?timestamp(job.expiresAt):Infinity);
      return db.prepare('INSERT INTO public_job_catalog (job_id, payload, expires_at, closed_until) VALUES (?, ?, ?, 0) ON CONFLICT(job_id) DO UPDATE SET payload = excluded.payload, expires_at = excluded.expires_at WHERE public_job_catalog.closed_until <= ?').bind(job.id,payload,expires,now);
    });
    statements.push(db.prepare('DELETE FROM public_job_catalog WHERE expires_at <= ? AND closed_until <= ?').bind(now,now));
    if(jobs.length)statements.push(db.prepare('SELECT job_id, closed_until FROM public_job_catalog WHERE job_id IN ('+jobs.map(()=>'?').join(',')+')').bind(...jobs.map(job=>job.public.id)));
    let outcome;
    try{outcome=await db.batch(statements);if(outcome.some(item=>item.success===false))throw new Error('D1 batch failed');}
    catch{throw catalogError();}
    const closed=new Set(jobs.length?(outcome.at(-1)?.results||[]).filter(row=>row.closed_until>now).map(row=>row.job_id):[]);
    // Persistence finishes before results reach the browser. A cold isolate can
    // now resolve the IDs without accepting a client-supplied listing snapshot.
    const visibleJobs=jobs.filter(job=>!closed.has(job.public.id)).map(job=>job.ranked);
    const sourceStatus=skipped?{
      ...result.source,
      status:visibleJobs.length?'partial':'unavailable',
      errors:[...(result.source.errors||[]),'Skipped '+skipped+' source listing'+(skipped===1?'':'s')+' that were malformed or no longer current.'],
    }:result.source;
    return {...result,source:sourceStatus,jobs:visibleJobs};
  }
  async function checkOpening(id){
    const row=await read(id),now=clock();
    if(row&&Number.isSafeInteger(row.closed_until)&&row.closed_until>now){
      let state='closed';
      try{if(typeof row.payload==='string'&&row.payload.length<=MAX_PAYLOAD&&JSON.parse(row.payload).catalogStatus==='not-found')state='not-found';}catch{}
      return {state,cached:true,checkedAt:new Date(row.closed_until-DAY).toISOString(),note:state==='not-found'?'The source previously could not find this listing.':'The source previously reported this listing closed.'};
    }
    const job=decode(row,now);
    if(!job)throw new Error('Listing is not in the current shared catalog or has expired. Run its search again.');
    source.hydrateKnownJob(job);
    const result=await source.checkOpening(id);
    if(result.state==='closed'||result.state==='not-found'){
      try{
        const outcome=await db.prepare('UPDATE public_job_catalog SET closed_until = MAX(closed_until, ?), payload = ? WHERE job_id = ?').bind(now+DAY,JSON.stringify({...job,catalogStatus:result.state}),id).run();
        if(outcome.success===false)throw new Error('D1 update failed');
      }catch{throw catalogError();}
    }
    return result;
  }
  return {searchOpportunities,getKnownJob,checkOpening};
}
