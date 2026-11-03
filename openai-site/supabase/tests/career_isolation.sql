-- Execute the entire file as one request. Only reserved synthetic fixtures are touched.
begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('30000000-0000-4000-8000-000000000001','career-a@example.invalid','{"name":"Career A"}',now(),now()),
('30000000-0000-4000-8000-000000000002','career-b@example.invalid','{"name":"Career B"}',now(),now());
insert into public.career_profiles(user_id,skills) values
('30000000-0000-4000-8000-000000000001',array['Python']),('30000000-0000-4000-8000-000000000002',array['Java']);
insert into public.opportunity_searches(id,user_id,filters,snapshot) values
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','{"skills":["Python"]}','{"jobs":[]}'),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','{"skills":["Java"]}','{"jobs":[]}');
insert into public.saved_opportunities(user_id,job_id,job_snapshot) values
('30000000-0000-4000-8000-000000000001','fixture-a','{"title":"Synthetic A"}'),
('30000000-0000-4000-8000-000000000002','fixture-b','{"title":"Synthetic B"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.career_profiles)<>1 then raise exception '1: profile isolation failed';end if;
 if (select count(*) from public.opportunity_searches)<>1 then raise exception '2: search isolation failed';end if;
 if (select count(*) from public.saved_opportunities)<>1 then raise exception '3: saved isolation failed';end if;
 if exists(select 1 from public.opportunity_searches where id='40000000-0000-4000-8000-000000000002') then raise exception '4: guessed ID disclosed data';end if;
end$$;
do $$declare blocked boolean:=false;begin
 begin insert into public.saved_opportunities(user_id,job_id,job_snapshot) values('30000000-0000-4000-8000-000000000002','spoof','{}');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception '5: forged saved owner accepted';end if;
end$$;
do $$declare blocked boolean:=false;begin
 begin insert into public.opportunity_searches(user_id,filters,snapshot) values('30000000-0000-4000-8000-000000000002','{}','{}');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception '6: forged search owner accepted';end if;
end$$;
do $$declare blocked boolean:=false;begin
 begin update public.career_profiles set user_id='30000000-0000-4000-8000-000000000003';exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception '7: profile owner reassignment accepted';end if;
end$$;
do $$declare changed integer;begin
 delete from public.opportunity_searches where id='40000000-0000-4000-8000-000000000002';get diagnostics changed=row_count;
 if changed<>0 then raise exception '8: cross-owner deletion accepted';end if;
end$$;
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$begin
 if (select skills from public.career_profiles limit 1)<>array['Java'] then raise exception '9: B profile incorrect';end if;
 if exists(select 1 from public.saved_opportunities where job_id='fixture-a') then raise exception '10: B sees A saved role';end if;
end$$;
reset role;
delete from auth.users where id='30000000-0000-4000-8000-000000000001';
do $$declare remaining integer;begin
 select (select count(*) from public.career_profiles where user_id='30000000-0000-4000-8000-000000000001')+(select count(*) from public.opportunity_searches where user_id='30000000-0000-4000-8000-000000000001')+(select count(*) from public.saved_opportunities where user_id='30000000-0000-4000-8000-000000000001') into remaining;
 if remaining<>0 then raise exception '11: career account cascade failed';end if;
 select (select count(*) from public.career_profiles where user_id='30000000-0000-4000-8000-000000000002')+(select count(*) from public.opportunity_searches where user_id='30000000-0000-4000-8000-000000000002')+(select count(*) from public.saved_opportunities where user_id='30000000-0000-4000-8000-000000000002') into remaining;
 if remaining<>3 then raise exception '12: deleting A affected B';end if;
end$$;
rollback;
select '12 career isolation assertions passed; synthetic data rolled back' as verification;
