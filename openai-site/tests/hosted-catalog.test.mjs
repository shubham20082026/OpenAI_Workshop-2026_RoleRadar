import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostedOpportunityService} from '../server/hosted-catalog.mjs';

const NOW=1_790_000_000_000;
const DAY=86_400_000;
const raw={title:'Python intern',companyName:'Example',employmentType:'Intern',seniority:['Entry-level'],description:'<p>Python and SQL</p>',locationRestrictions:['India'],pubDate:1_780_000_000,expiryDate:1_900_000_000,guid:'https://himalayas.app/companies/example/jobs/python-intern',applicationLink:'https://himalayas.app/companies/example/jobs/python-intern?utm_source=api'};

// Small D1 contract fake: SQL is asserted and bindings execute the same upsert,
// expiration and tombstone conditions as the production statements.
function fakeD1(){
  const rows=new Map();
  let fail=false,beforeBatch=null;
  const db={rows,setFailure(value){fail=value;},setBeforeBatch(callback){beforeBatch=callback;},prepare(sql){
    let args=[];
    const statement={bind(...values){args=values;return statement;},async first(){
      if(fail)throw new Error('simulated D1 failure');
      assert.equal(sql,'SELECT job_id, payload, expires_at, closed_until FROM public_job_catalog WHERE job_id = ?');
      return rows.has(args[0])?{...rows.get(args[0])}:null;
    },async run(){return execute();},execute};
    function execute(){
      if(fail)throw new Error('simulated D1 failure');
      if(sql.startsWith('INSERT INTO public_job_catalog')){
        assert.match(sql,/ON CONFLICT\(job_id\).*WHERE public_job_catalog.closed_until <= \?/);
        const [job_id,payload,expires_at,now]=args,old=rows.get(job_id);
        if(!old||old.closed_until<=now)rows.set(job_id,{job_id,payload,expires_at,closed_until:old?.closed_until||0});
        return {success:true,results:[]};
      }
      if(sql.startsWith('DELETE FROM public_job_catalog')){
        for(const [id,row] of rows)if(row.expires_at<=args[0]&&row.closed_until<=args[1])rows.delete(id);
        return {success:true,results:[]};
      }
      if(sql.startsWith('SELECT job_id, closed_until FROM public_job_catalog WHERE job_id IN'))return {success:true,results:args.filter(id=>rows.has(id)).map(id=>({job_id:id,closed_until:rows.get(id).closed_until}))};
      if(sql.startsWith('UPDATE public_job_catalog SET closed_until = MAX')){
        const [until,payload,id]=args,row=rows.get(id);
        if(row)rows.set(id,{...row,closed_until:Math.max(row.closed_until,until),payload});
        return {success:true,results:[]};
      }
      throw new Error('Unexpected SQL in test: '+sql);
    }
    return statement;
  },async batch(statements){if(beforeBatch)await beforeBatch();return statements.map(item=>item.execute());}};
  return db;
}
function service(db,{clock=()=>NOW,opening=200,fetchLog=[],sourceJobs=[raw]}={}){
  return createHostedOpportunityService({db,clock,fetchImpl:async url=>{
    fetchLog.push(url);
    return url.includes('/search')?Response.json({jobs:sourceJobs,totalCount:sourceJobs.length,limit:20}):new Response('{}',{status:opening});
  }});
}

test('a cold isolate resolves a retrieved ID and checks source status without a new search',async()=>{
  const db=fakeD1(),first=service(db);
  const result=await first.searchOpportunities({skills:['Python']});
  const id=result.jobs[0].id,requests=[];
  const cold=service(db,{fetchLog:requests});
  assert.equal((await cold.getKnownJob(id)).title,'Python intern');
  assert.equal((await cold.checkOpening(id)).state,'open');
  assert.equal(requests.length,1);
  assert.ok(!requests[0].includes('/search'));
});

test('shared records store only canonical public fields, not skill filters or ranking',async()=>{
  const db=fakeD1();
  const result=await service(db).searchOpportunities({skills:['Python'],query:'SQL'});
  assert.equal(result.jobs[0].match.matchedCount,1);
  const stored=JSON.parse(db.rows.get(result.jobs[0].id).payload);
  assert.equal(stored.match,undefined);assert.equal(stored.skills,undefined);assert.equal(stored.filters,undefined);
  assert.equal(stored.descriptionPlain,'Python and SQL');
  assert.equal(stored.applyUrl,raw.applicationLink);
});

test('search waits for shared persistence before exposing listing IDs',async()=>{
  const db=fakeD1();let release,entered=false,settled=false;
  const wait=new Promise(resolve=>{release=resolve;});
  db.setBeforeBatch(async()=>{entered=true;await wait;});
  const pending=service(db).searchOpportunities({}).then(value=>{settled=true;return value;});
  for(let turn=0;turn<20&&!entered;turn++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(entered,true);assert.equal(settled,false);assert.equal(db.rows.size,0);
  release();const result=await pending;
  assert.equal(db.rows.has(result.jobs[0].id),true);
});

test('expired, malformed and mismatched-ID stored listings cannot be used for saves',async()=>{
  const db=fakeD1(),first=service(db);
  const id=(await first.searchOpportunities({})).jobs[0].id,record={...db.rows.get(id)};
  db.rows.set(id,{...record,expires_at:NOW});assert.equal(await service(db).getKnownJob(id),null);
  db.rows.set(id,{...record,payload:'{invalid json'});assert.equal(await service(db).getKnownJob(id),null);
  db.rows.set(id,{...record,payload:JSON.stringify({...JSON.parse(record.payload),guid:'https://himalayas.app/companies/other/jobs/other'})});assert.equal(await service(db).getKnownJob(id),null);
  db.rows.set(id,record);assert.equal(await service(db,{clock:()=>NOW+DAY}).getKnownJob(id),null);
  assert.equal(await service(db).getKnownJob('../../anything'),null);
});

for(const [httpStatus,state] of [[410,'closed'],[404,'not-found']]){
  test('durable '+state+' tombstones block warm/cold saves and stale search resurrection',async()=>{
    const db=fakeD1(),warm=service(db),id=(await warm.searchOpportunities({})).jobs[0].id;
    // Prime a warm isolate before another isolate learns closure.
    assert.ok(await warm.getKnownJob(id));
    assert.equal((await service(db,{opening:httpStatus}).checkOpening(id)).state,state);
    assert.equal(await warm.getKnownJob(id),null);
    const coldRequests=[],cold=service(db,{fetchLog:coldRequests});
    assert.equal(await cold.getKnownJob(id),null);
    const status=await cold.checkOpening(id);
    assert.equal(status.state,state);assert.equal(status.cached,true);assert.equal(coldRequests.length,0);
    assert.deepEqual((await cold.searchOpportunities({})).jobs,[]);
    assert.equal(db.rows.get(id).closed_until,NOW+DAY);
    assert.equal(await cold.getKnownJob(id),null);
  });
}

test('D1 failures fail explicitly instead of returning an unresolvable catalog or invented status',async()=>{
  const db=fakeD1(),first=service(db),id=(await first.searchOpportunities({})).jobs[0].id;
  db.setFailure(true);
  for(const action of [()=>service(db).searchOpportunities({}),()=>service(db).getKnownJob(id),()=>service(db).checkOpening(id)]){
    await assert.rejects(action,error=>error.code==='PUBLIC_CATALOG_UNAVAILABLE'&&error.status===503&&!error.message.includes('simulated'));
  }
});

test('malformed independent listings and salaries are omitted while valid source evidence remains usable',async()=>{
  const db=fakeD1();
  const malformedTitle={...raw,title:'',guid:'https://himalayas.app/companies/example/jobs/blank-title'};
  const malformedSalary={...raw,minSalary:-100,maxSalary:100,currency:'USD',salaryPeriod:'annual',guid:'https://himalayas.app/companies/example/jobs/bad-salary'};
  const result=await service(db,{sourceJobs:[raw,malformedTitle,malformedSalary]}).searchOpportunities({});
  assert.equal(result.jobs.length,1);
  assert.equal(result.jobs[0].title,'Python intern');
  assert.equal(result.source.status,'partial');
  assert.match(result.source.errors.at(-1),/Skipped 2 source listings.*malformed or no longer current/);
  assert.equal(db.rows.size,1);
  assert.equal((await service(db).getKnownJob(result.jobs[0].id)).title,'Python intern');
});

test('a nonempty source page with no usable records becomes explicitly unavailable without fabricated replacements',async()=>{
  const db=fakeD1();
  const result=await service(db,{sourceJobs:[{...raw,title:''}]}).searchOpportunities({});
  assert.deepEqual(result.jobs,[]);
  assert.equal(result.source.status,'unavailable');
  assert.match(result.source.errors.at(-1),/Skipped 1 source listing/);
  assert.equal(db.rows.size,0);
});

test('a warm page crossing its 24-hour freshness window during a later fetch is disclosed instead of aborting the search',async()=>{
  const db=fakeD1();let now=NOW;
  const adapter=createHostedOpportunityService({db,clock:()=>now,fetchImpl:async url=>{
    const later=new URL(url).searchParams.get('page')==='2';
    if(later)now=NOW+DAY+1;
    return Response.json({jobs:[later?{...raw,guid:'https://himalayas.app/companies/example/jobs/second-intern'}:raw],totalCount:2,limit:1});
  }});
  assert.equal((await adapter.searchOpportunities({pages:1})).jobs.length,1);
  now=NOW+DAY-1;
  const result=await adapter.searchOpportunities({pages:2});
  assert.deepEqual(result.jobs,[]);
  assert.equal(result.source.status,'unavailable');
  assert.match(result.source.errors.at(-1),/no longer current/);
  assert.equal(db.rows.size,0);
});
