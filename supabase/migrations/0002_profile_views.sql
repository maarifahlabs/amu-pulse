-- Daily and total views for public candidate profiles.
-- The page calls these functions with the anon key. The table itself is not readable.

create table candidate_profile_views (
  candidate_id uuid not null references candidates(id) on delete cascade,
  viewed_on date not null,
  view_count integer not null default 0 check (view_count >= 0),
  primary key (candidate_id, viewed_on)
);

alter table candidate_profile_views enable row level security;

create or replace function candidate_view_stats(p_slug text)
returns table (daily_views bigint, total_views bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  today date := (timezone('Asia/Kolkata', now()))::date;
begin
  select id into cid
  from candidates
  where slug = p_slug and verification_status = 'verified';

  if cid is null then
    return query select 0::bigint, 0::bigint;
    return;
  end if;

  return query
  select
    coalesce((select view_count from candidate_profile_views where candidate_id = cid and viewed_on = today), 0)::bigint,
    coalesce((select sum(view_count) from candidate_profile_views where candidate_id = cid), 0)::bigint;
end;
$$;

create or replace function record_candidate_view(p_slug text)
returns table (daily_views bigint, total_views bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  today date := (timezone('Asia/Kolkata', now()))::date;
begin
  select id into cid
  from candidates
  where slug = p_slug and verification_status = 'verified';

  if cid is null then
    return query select 0::bigint, 0::bigint;
    return;
  end if;

  insert into candidate_profile_views (candidate_id, viewed_on, view_count)
  values (cid, today, 1)
  on conflict (candidate_id, viewed_on)
  do update set view_count = candidate_profile_views.view_count + 1;

  return query select * from candidate_view_stats(p_slug);
end;
$$;

revoke all on function candidate_view_stats(text) from public;
revoke all on function record_candidate_view(text) from public;
grant execute on function candidate_view_stats(text) to anon, authenticated;
grant execute on function record_candidate_view(text) to anon, authenticated;
