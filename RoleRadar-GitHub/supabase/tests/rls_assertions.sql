-- Fail-closed version of rls_isolation.sql: every failed assertion raises.
-- Reserved synthetic IDs abort safely on collision. Never remove ROLLBACK.
-- Run the entire file as ONE SQL request. The final success marker is only
-- reached if every statement succeeds and all synthetic changes roll back.
begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at)
values('10000000-0000-4000-8000-000000000001','alice@example.test','{"name":"Alice"}',now(),now()),
('10000000-0000-4000-8000-000000000002','bob@example.test','{"name":"Bob"}',now(),now());
insert into public.sessions(id,user_id,title,input_text) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Alice inspection','Alice-only input'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Bob inspection','Bob-only input');
insert into public.messages(session_id,user_id,role,source,content) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','user','input','Alice-only message'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','user','input','Bob-only message');
insert into public.results(session_id,user_id,source,payload) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','local','{"owner":"Alice"}'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','local','{"owner":"Bob"}');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare rejected boolean; changed_rows bigint;
begin
  if (select count(*) from public.users)<>1 then raise exception 'Assertion 1 failed: Alice profile isolation';end if;
  if (select count(*) from public.sessions)<>1 then raise exception 'Assertion 2 failed: Alice session isolation';end if;
  if (select count(*) from public.messages)<>1 then raise exception 'Assertion 3 failed: Alice message isolation';end if;
  if (select count(*) from public.results)<>1 then raise exception 'Assertion 4 failed: Alice result isolation';end if;
  if (select count(*) from public.settings)<>1 then raise exception 'Assertion 5 failed: Alice settings isolation';end if;
  if exists(select 1 from public.sessions where id='20000000-0000-4000-8000-000000000002') then raise exception 'Assertion 6 failed: guessed Bob session is visible';end if;

  rejected:=false;
  begin
    insert into public.sessions(user_id,title,input_text) values('10000000-0000-4000-8000-000000000002','Spoof','x');
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Assertion 7 failed: Alice inserted as Bob';end if;

  rejected:=false;
  begin
    insert into public.messages(session_id,user_id,role,source,content) values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','user','input','spoof');
  exception when foreign_key_violation then rejected:=true;
  end;
  if not rejected then raise exception 'Assertion 8 failed: cross-owner message link succeeded';end if;

  rejected:=false;
  begin
    insert into public.results(session_id,user_id,source,payload) values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','chatgpt','{}');
  exception when foreign_key_violation then rejected:=true;
  end;
  if not rejected then raise exception 'Assertion 9 failed: cross-owner result link succeeded';end if;

  update public.users set name='Hacked' where id='10000000-0000-4000-8000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows<>0 then raise exception 'Assertion 10 failed: Alice changed Bob profile';end if;

  rejected:=false;
  begin
    update public.users set email='other@example.test';
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Assertion 11 failed: profile email was client-writable';end if;

  delete from public.sessions where id='20000000-0000-4000-8000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows<>0 then raise exception 'Assertion 12 failed: Alice deleted Bob inspection';end if;
end;
$$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$
begin
  if (select input_text from public.sessions limit 1) is distinct from 'Bob-only input' then raise exception 'Assertion 13 failed: Bob own input unavailable';end if;
  if exists(select 1 from public.sessions where user_id='10000000-0000-4000-8000-000000000001') then raise exception 'Assertion 14 failed: Bob can see Alice inspections';end if;
end;
$$;
reset role;
delete from auth.users where id='10000000-0000-4000-8000-000000000001';
do $$
begin
  if exists(select 1 from public.users where id='10000000-0000-4000-8000-000000000001') then raise exception 'Assertion 15 failed: auth deletion did not cascade profile';end if;
  if exists(select 1 from public.sessions where user_id='10000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.messages where user_id='10000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.results where user_id='10000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.settings where user_id='10000000-0000-4000-8000-000000000001')
  then raise exception 'Assertion 16 failed: auth deletion left linked data';end if;
end;
$$;
rollback;
select '16 isolation assertions passed; synthetic data rolled back' as verification;
