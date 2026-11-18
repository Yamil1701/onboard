-- Isolated objects. Existing Chofer Utilities tables, auth and policies are untouched.
create table public.voyageurs_wall_limits (
  ip_hash text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);
create table public.voyageurs_wall_entries (
  id uuid primary key default gen_random_uuid(),
  client_token uuid not null unique,
  ip_hash text not null,
  message text not null check (char_length(message) between 2 and 160),
  language text not null check (language in ('ar','fr')),
  status text not null default 'pending' check (status in ('approved','pending','rejected')),
  created_at timestamptz not null default now()
);
create index voyageurs_wall_recent on public.voyageurs_wall_entries (created_at desc) where status = 'approved';
alter table public.voyageurs_wall_entries enable row level security;
alter table public.voyageurs_wall_limits enable row level security;
revoke all on public.voyageurs_wall_entries, public.voyageurs_wall_limits from public, anon, authenticated;
grant all on public.voyageurs_wall_entries, public.voyageurs_wall_limits to service_role;

create function public.voyageurs_post_footprint(p_token uuid, p_ip text, p_message text, p_language text, p_status text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare entry public.voyageurs_wall_entries; gate public.voyageurs_wall_limits;
begin
  if p_status not in ('approved','pending') or length(p_ip) <> 64 then raise exception 'invalid_input'; end if;
  insert into public.voyageurs_wall_limits(ip_hash) values(p_ip) on conflict do nothing;
  select * into gate from public.voyageurs_wall_limits where ip_hash=p_ip for update;
  select * into entry from public.voyageurs_wall_entries where client_token=p_token;
  if found then
    return jsonb_build_object('id',entry.id,'message',entry.message,'status',entry.status,'created_at',entry.created_at);
  end if;
  if gate.window_start < now()-interval '1 minute' then
    update public.voyageurs_wall_limits set window_start=now(), attempts=0 where ip_hash=p_ip;
    gate.attempts := 0;
  end if;
  if gate.attempts >= 20 then raise exception 'rate_limit'; end if;
  update public.voyageurs_wall_limits set attempts=attempts+1 where ip_hash=p_ip;
  insert into public.voyageurs_wall_entries(client_token,ip_hash,message,language,status)
    values(p_token,p_ip,p_message,p_language,p_status) returning * into entry;
  return jsonb_build_object('id',entry.id,'message',entry.message,'status',entry.status,'created_at',entry.created_at);
end;
$$;
revoke all on function public.voyageurs_post_footprint(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.voyageurs_post_footprint(uuid,text,text,text,text) to service_role;
