-- Private Voyageurs survey intake and PIN access; unrelated project data is untouched.
create table public.voyageurs_survey_entries (
  token uuid primary key,
  language text not null check(language in ('ar','fr')),
  expectation text not null check(expectation in ('adapt','play','ideas')),
  answers smallint[] check(answers is null or (array_length(answers,1)=5 and array_ndims(answers)=1 and answers <@ array[0,1,2]::smallint[] and array_position(answers,null) is null)),
  rating smallint check(rating between 1 and 5),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check(rating is null or answers is not null)
);
create table public.voyageurs_results_access (id boolean primary key default true check(id),salt text not null,pin_hash text not null);
create table public.voyageurs_survey_limits (bucket text primary key,window_start timestamptz not null default now(),attempts integer not null default 0);
alter table public.voyageurs_survey_entries enable row level security;
alter table public.voyageurs_results_access enable row level security;
alter table public.voyageurs_survey_limits enable row level security;
revoke all on public.voyageurs_survey_entries,public.voyageurs_results_access,public.voyageurs_survey_limits from public,anon,authenticated;
grant all on public.voyageurs_survey_entries,public.voyageurs_results_access,public.voyageurs_survey_limits to service_role;

create function public.voyageurs_survey_gate(p_bucket text,p_login boolean) returns boolean
language plpgsql security invoker set search_path='' as $$
declare gate public.voyageurs_survey_limits;
begin
  if length(p_bucket)>100 then return false; end if;
  insert into public.voyageurs_survey_limits(bucket) values(p_bucket) on conflict do nothing;
  select * into gate from public.voyageurs_survey_limits where bucket=p_bucket for update;
  if gate.window_start<now()-(case when p_login then interval '10 minutes' else interval '1 minute' end) then
    update public.voyageurs_survey_limits set attempts=0,window_start=now() where bucket=p_bucket;
    gate.attempts:=0;
  end if;
  if gate.attempts>=(case when p_login then 8 else 120 end) then return false;end if;
  update public.voyageurs_survey_limits set attempts=attempts+1 where bucket=p_bucket;
  return true;
end;$$;
create function public.voyageurs_save_survey(p_token uuid,p_language text,p_expectation text,p_answers smallint[],p_rating smallint) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
  insert into public.voyageurs_survey_entries(token,language,expectation,answers,rating,completed_at)
  values(p_token,p_language,p_expectation,p_answers,p_rating,case when p_answers is null then null else now() end)
  on conflict(token) do update set
    language=excluded.language,
    answers=coalesce(excluded.answers,voyageurs_survey_entries.answers),
    rating=case when excluded.answers is not null then excluded.rating else voyageurs_survey_entries.rating end,
    completed_at=coalesce(voyageurs_survey_entries.completed_at,excluded.completed_at);
  return true;
end;$$;
create function public.voyageurs_survey_results() returns jsonb language sql security invoker set search_path='' as $$
select jsonb_build_object(
 'started',(select count(*) from public.voyageurs_survey_entries),
 'completed',(select count(*) from public.voyageurs_survey_entries where answers is not null),
 'ratingCount',(select count(rating) from public.voyageurs_survey_entries),
 'ratingAverage',(select round(avg(rating),2) from public.voyageurs_survey_entries),
 'expectations',(select coalesce(jsonb_object_agg(expectation,n),'{}') from (select expectation,count(*) n from public.voyageurs_survey_entries group by expectation) s),
 'questions',(select jsonb_agg(counts order by question) from (select question,(select jsonb_agg(n order by answer) from (select answer,(select count(*) from public.voyageurs_survey_entries where answers[question]=answer) n from generate_series(0,2) answer) options) counts from generate_series(1,5) question) questions),
 'ratings',(select jsonb_agg(n order by stars) from (select stars,(select count(*) from public.voyageurs_survey_entries where rating=stars) n from generate_series(1,5) stars) ratings),
 'recent',(select coalesce(jsonb_agg(row_to_json(r)),'[]') from (select language,expectation,answers,rating,created_at,completed_at from public.voyageurs_survey_entries order by created_at desc limit 100) r)
);$$;
revoke all on function public.voyageurs_survey_gate(text,boolean),public.voyageurs_save_survey(uuid,text,text,smallint[],smallint),public.voyageurs_survey_results() from public,anon,authenticated;
grant execute on function public.voyageurs_survey_gate(text,boolean),public.voyageurs_save_survey(uuid,text,text,smallint[],smallint),public.voyageurs_survey_results() to service_role;
