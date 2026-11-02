-- Isolated rollback transaction with reserved synthetic IDs after the migration.
-- Never remove ROLLBACK. Existing rows are not modified by these fixtures.
-- Never describe these assertions as passed until executed successfully.
begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select plan(16);
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
select is((select count(*)::int from public.users),1,'Alice sees only her profile');
select is((select count(*)::int from public.sessions),1,'Alice sees only her session');
select is((select count(*)::int from public.messages),1,'Alice sees only her message');
select is((select count(*)::int from public.results),1,'Alice sees only her result');
select is((select count(*)::int from public.settings),1,'Alice sees only her settings');
select is((select count(*)::int from public.sessions where id='20000000-0000-4000-8000-000000000002'),0,'Guessing Bob session ID exposes nothing');
select throws_ok($$insert into public.sessions(user_id,title,input_text) values('10000000-0000-4000-8000-000000000002','Spoof','x')$$,'42501',null,'Cannot insert under Bob user_id');
select throws_ok($$insert into public.messages(session_id,user_id,role,source,content) values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','user','input','spoof')$$,'23503',null,'Cannot link Alice message to Bob session');
select throws_ok($$insert into public.results(session_id,user_id,source,payload) values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','chatgpt','{}')$$,'23503',null,'Cannot link Alice result to Bob session');
with changed as (update public.users set name='Hacked' where id='10000000-0000-4000-8000-000000000002' returning 1)
select is((select count(*)::int from changed),0,'Cannot change Bob profile');
select throws_ok($$update public.users set email='other@example.test'$$,'42501',null,'Profile email is not client-writable');
with removed as (delete from public.sessions where id='20000000-0000-4000-8000-000000000002' returning 1)
select is((select count(*)::int from removed),0,'Cannot delete Bob session');

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select input_text from public.sessions limit 1),'Bob-only input','Bob sees his own input');
select is((select count(*)::int from public.sessions where user_id='10000000-0000-4000-8000-000000000001'),0,'Bob cannot see Alice sessions');
reset role;
delete from auth.users where id='10000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.users where id='10000000-0000-4000-8000-000000000001'),0,'Auth deletion cascades profile');
select is((select count(*)::int from public.sessions where user_id='10000000-0000-4000-8000-000000000001')+(select count(*)::int from public.messages where user_id='10000000-0000-4000-8000-000000000001')+(select count(*)::int from public.results where user_id='10000000-0000-4000-8000-000000000001')+(select count(*)::int from public.settings where user_id='10000000-0000-4000-8000-000000000001'),0,'Auth deletion cascades every linked record');
select * from finish();
rollback;
