begin;
create table public.career_profiles (
 user_id uuid primary key references public.users(id) on delete cascade,
 skills text[] not null default '{}' check(cardinality(skills)<=20 and octet_length(skills::text)<=2000 and array_position(skills,null) is null),
 preferred_location text not null default 'India' check(preferred_location in ('India','Worldwide','Any')),
 opportunity_type text not null default 'internship' check(opportunity_type in ('internship','entry','all')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.opportunity_searches (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 filters jsonb not null check(jsonb_typeof(filters)='object' and octet_length(filters::text)<=8000),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=500000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.saved_opportunities (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 job_id text not null check(char_length(job_id) between 1 and 100),
 job_snapshot jsonb not null check(jsonb_typeof(job_snapshot)='object' and octet_length(job_snapshot::text)<=40000),
 status text not null default 'saved' check(status in ('saved','applied','interview','closed')),
 notes text not null default '' check(char_length(notes)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,job_id)
);
create index opportunity_searches_owner_time on public.opportunity_searches(user_id,created_at desc,id desc);
create index saved_opportunities_owner_time on public.saved_opportunities(user_id,created_at desc,id desc);
create trigger career_profiles_touch before update on public.career_profiles for each row execute function public.touch_updated_at();
create trigger opportunity_searches_touch before update on public.opportunity_searches for each row execute function public.touch_updated_at();
create trigger saved_opportunities_touch before update on public.saved_opportunities for each row execute function public.touch_updated_at();
alter table public.career_profiles enable row level security;
alter table public.career_profiles force row level security;
alter table public.opportunity_searches enable row level security;
alter table public.opportunity_searches force row level security;
alter table public.saved_opportunities enable row level security;
alter table public.saved_opportunities force row level security;
create policy career_profiles_select_own on public.career_profiles for select to authenticated using((select auth.uid())=user_id);
create policy career_profiles_insert_own on public.career_profiles for insert to authenticated with check((select auth.uid())=user_id);
create policy career_profiles_update_own on public.career_profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy career_profiles_delete_own on public.career_profiles for delete to authenticated using((select auth.uid())=user_id);
create policy opportunity_searches_select_own on public.opportunity_searches for select to authenticated using((select auth.uid())=user_id);
create policy opportunity_searches_insert_own on public.opportunity_searches for insert to authenticated with check((select auth.uid())=user_id);
create policy opportunity_searches_delete_own on public.opportunity_searches for delete to authenticated using((select auth.uid())=user_id);
create policy saved_opportunities_select_own on public.saved_opportunities for select to authenticated using((select auth.uid())=user_id);
create policy saved_opportunities_insert_own on public.saved_opportunities for insert to authenticated with check((select auth.uid())=user_id);
create policy saved_opportunities_update_own on public.saved_opportunities for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy saved_opportunities_delete_own on public.saved_opportunities for delete to authenticated using((select auth.uid())=user_id);
revoke all on public.career_profiles,public.opportunity_searches,public.saved_opportunities from anon,authenticated;
grant select,insert,delete on public.career_profiles,public.opportunity_searches,public.saved_opportunities to authenticated;
grant update(user_id,skills,preferred_location,opportunity_type) on public.career_profiles to authenticated;
grant update(notes,status) on public.saved_opportunities to authenticated;
grant all on public.career_profiles,public.opportunity_searches,public.saved_opportunities to service_role;
commit;
