-- Apply once in a fresh Supabase project's SQL editor, or with the Supabase CLI.
-- No service-role key is used in normal application queries.
begin;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Message inspection' check (char_length(title) between 1 and 100),
  input_text text not null check (char_length(input_text) between 1 and 6000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  source text not null check (source in ('input','local','chatgpt')),
  content text not null check (char_length(content) between 1 and 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (session_id,user_id) references public.sessions(id,user_id) on delete cascade
);
create table public.results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null check (source in ('local','chatgpt')),
  payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=40000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id,source),
  foreign key (session_id,user_id) references public.sessions(id,user_id) on delete cascade
);
create table public.settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  save_history boolean not null default true,
  theme text not null default 'dark' check (theme='dark'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sessions_owner_time on public.sessions(user_id,created_at desc,id desc);
create index messages_owner_session on public.messages(user_id,session_id,created_at);
create index results_owner_session on public.results(user_id,session_id,created_at);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();return new;end;$$;
create trigger users_updated before update on public.users for each row execute function public.touch_updated_at();
create trigger sessions_updated before update on public.sessions for each row execute function public.touch_updated_at();
create trigger messages_updated before update on public.messages for each row execute function public.touch_updated_at();
create trigger results_updated before update on public.results for each row execute function public.touch_updated_at();
create trigger settings_updated before update on public.settings for each row execute function public.touch_updated_at();

-- Trigger obtains identity from auth.users, never a submitted user_id or role.
create function public.sync_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.users(id,name,email,created_at)
  values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'name'),''),'Student'),80),coalesce(new.email,''),new.created_at)
  on conflict(id) do update set email=excluded.email;
  insert into public.settings(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end;$$;
create trigger sync_new_auth_user after insert or update of email on auth.users for each row execute function public.sync_auth_profile();

alter table public.users enable row level security;
alter table public.users force row level security;
alter table public.sessions enable row level security;
alter table public.sessions force row level security;
alter table public.messages enable row level security;
alter table public.messages force row level security;
alter table public.results enable row level security;
alter table public.results force row level security;
alter table public.settings enable row level security;
alter table public.settings force row level security;

create policy users_select_own on public.users for select to authenticated using ((select auth.uid())=id);
create policy users_update_own on public.users for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy settings_select_own on public.settings for select to authenticated using ((select auth.uid())=user_id);
create policy settings_update_own on public.settings for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy sessions_select_own on public.sessions for select to authenticated using ((select auth.uid())=user_id);
create policy sessions_insert_own on public.sessions for insert to authenticated with check ((select auth.uid())=user_id);
create policy sessions_delete_own on public.sessions for delete to authenticated using ((select auth.uid())=user_id);
create policy messages_select_own on public.messages for select to authenticated using ((select auth.uid())=user_id);
create policy messages_insert_own on public.messages for insert to authenticated with check ((select auth.uid())=user_id);
create policy messages_delete_own on public.messages for delete to authenticated using ((select auth.uid())=user_id);
create policy results_select_own on public.results for select to authenticated using ((select auth.uid())=user_id);
create policy results_insert_own on public.results for insert to authenticated with check ((select auth.uid())=user_id);
create policy results_delete_own on public.results for delete to authenticated using ((select auth.uid())=user_id);

revoke all on public.users,public.sessions,public.messages,public.results,public.settings from anon,authenticated;
grant select on public.users,public.sessions,public.messages,public.results,public.settings to authenticated;
grant update(name) on public.users to authenticated;
grant update(save_history) on public.settings to authenticated;
grant insert(user_id,title,input_text) on public.sessions to authenticated;
grant insert(session_id,user_id,role,source,content) on public.messages to authenticated;
grant insert(session_id,user_id,source,payload) on public.results to authenticated;
grant delete on public.sessions,public.messages,public.results to authenticated;
grant all on public.users,public.sessions,public.messages,public.results,public.settings to service_role;
revoke all on function public.sync_auth_profile() from public,anon,authenticated;
revoke all on function public.touch_updated_at() from public,anon,authenticated;

-- One transaction stores the input, generated prompt, imported AI explanation,
-- and local result together. This is SECURITY INVOKER: all inserts obey RLS.
create function public.create_inspection_atomic(
  p_input_text text,
  p_title text,
  p_local_result jsonb,
  p_ai_result jsonb default null,
  p_ai_prompt text default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare owner_id uuid := auth.uid(); inspection_id uuid;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
  if not exists(select 1 from public.settings where user_id=owner_id and save_history) then raise exception 'History saving is disabled' using errcode='42501';end if;
  if p_local_result is null or jsonb_typeof(p_local_result)<>'object' then raise exception 'Local result must be an object' using errcode='22023';end if;
  if p_ai_result is not null and (jsonb_typeof(p_ai_result)<>'object' or p_ai_prompt is null) then raise exception 'AI result needs its prompt' using errcode='22023';end if;
  insert into public.sessions(user_id,title,input_text) values(owner_id,p_title,p_input_text) returning id into inspection_id;
  insert into public.messages(session_id,user_id,role,source,content) values(inspection_id,owner_id,'user','input',p_input_text);
  insert into public.messages(session_id,user_id,role,source,content) values(inspection_id,owner_id,'assistant','local',p_local_result::text);
  insert into public.results(session_id,user_id,source,payload) values(inspection_id,owner_id,'local',p_local_result);
  if p_ai_result is not null then
    insert into public.messages(session_id,user_id,role,source,content) values(inspection_id,owner_id,'system','chatgpt',p_ai_prompt),(inspection_id,owner_id,'assistant','chatgpt',p_ai_result::text);
    insert into public.results(session_id,user_id,source,payload) values(inspection_id,owner_id,'chatgpt',p_ai_result);
  end if;
  return inspection_id;
end;$$;
revoke all on function public.create_inspection_atomic(text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.create_inspection_atomic(text,text,jsonb,jsonb,text) to authenticated;

-- Backfill only real existing Auth users if migration follows account creation.
insert into public.users(id,name,email,created_at)
select id,left(coalesce(nullif(btrim(raw_user_meta_data->>'name'),''),'Student'),80),coalesce(email,''),created_at from auth.users on conflict(id) do nothing;
insert into public.settings(user_id) select id from public.users on conflict(user_id) do nothing;
commit;
