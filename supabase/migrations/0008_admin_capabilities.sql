-- Migration: 0008_admin_capabilities.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Grants comprehensive administrative superpowers for candidate, claims, questions, users & audit logs.

-- 1. Helper function: verify caller is an active admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 2. Table-level grants & RLS Policies: Allow Admins full read/write on candidates, profiles, and audit_logs
grant select, insert, update, delete on public.candidates to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.audit_logs to authenticated;

drop policy if exists "Admins full candidates" on public.candidates;
create policy "Admins full candidates"
on public.candidates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins view audit logs" on public.audit_logs;
create policy "Admins view audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

-- 3. RPC: admin_get_all_candidates
create or replace function admin_get_all_candidates()
returns table (
  id uuid,
  slug text,
  profile_id uuid,
  position_id uuid,
  ballot_number int,
  name text,
  department text,
  faculty text,
  bio text,
  photo_url text,
  verification_status verification_status,
  official_source_url text,
  created_at timestamptz,
  updated_at timestamptz,
  position_title text,
  position_slug text,
  claimed_display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      c.id,
      c.slug,
      c.profile_id,
      c.position_id,
      c.ballot_number,
      c.name,
      c.department,
      c.faculty,
      c.bio,
      c.photo_url,
      c.verification_status,
      c.official_source_url,
      c.created_at,
      c.updated_at,
      p.title as position_title,
      p.slug as position_slug,
      pr.display_name as claimed_display_name
    from public.candidates c
    left join public.positions p on p.id = c.position_id
    left join public.profiles pr on pr.id = c.profile_id
    order by coalesce(c.ballot_number, 9999), c.name;
end;
$$;

-- 4. RPC: admin_create_candidate
create or replace function admin_create_candidate(
  p_name text,
  p_position_id uuid,
  p_ballot_number int default null,
  p_department text default null,
  p_faculty text default null,
  p_bio text default null,
  p_photo_url text default null,
  p_source_url text default null,
  p_verification_status text default 'verified'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cid uuid := gen_random_uuid();
  v_clean_name text := trim(p_name);
  v_slug text;
  v_status verification_status;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  if length(v_clean_name) < 2 then
    return jsonb_build_object('success', false, 'error', 'Name must have at least 2 characters.');
  end if;

  v_slug := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug) || '-' || substr(md5(random()::text), 1, 4);

  v_status := case
    when p_verification_status = 'unverified' then 'unverified'::verification_status
    when p_verification_status = 'rejected' then 'rejected'::verification_status
    else 'verified'::verification_status
  end;

  insert into public.candidates (
    id, slug, position_id, ballot_number, name, department, faculty, bio, photo_url, official_source_url, verification_status
  ) values (
    v_cid, v_slug, p_position_id, p_ballot_number, v_clean_name, p_department, p_faculty, p_bio, p_photo_url, p_source_url, v_status
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'candidate.admin_create', 'candidate', v_cid, jsonb_build_object('name', v_clean_name, 'position_id', p_position_id));

  return jsonb_build_object('success', true, 'id', v_cid, 'slug', v_slug);
end;
$$;

-- 5. RPC: admin_update_candidate
create or replace function admin_update_candidate(
  p_id uuid,
  p_name text,
  p_position_id uuid,
  p_ballot_number int default null,
  p_department text default null,
  p_faculty text default null,
  p_bio text default null,
  p_photo_url text default null,
  p_source_url text default null,
  p_verification_status text default 'verified'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status verification_status;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  v_status := case
    when p_verification_status = 'unverified' then 'unverified'::verification_status
    when p_verification_status = 'rejected' then 'rejected'::verification_status
    else 'verified'::verification_status
  end;

  update public.candidates
  set
    name = trim(p_name),
    position_id = p_position_id,
    ballot_number = p_ballot_number,
    department = p_department,
    faculty = p_faculty,
    bio = p_bio,
    photo_url = p_photo_url,
    official_source_url = p_source_url,
    verification_status = v_status,
    updated_at = now()
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Candidate not found.');
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'candidate.admin_update', 'candidate', p_id, jsonb_build_object('name', p_name));

  return jsonb_build_object('success', true);
end;
$$;

-- 6. RPC: admin_toggle_verify_candidate
create or replace function admin_toggle_verify_candidate(
  p_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new_status verification_status;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  v_new_status := case
    when p_status = 'verified' then 'verified'::verification_status
    when p_status = 'rejected' then 'rejected'::verification_status
    else 'unverified'::verification_status
  end;

  update public.candidates
  set verification_status = v_new_status, updated_at = now()
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Candidate not found.');
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'candidate.verify_status', 'candidate', p_id, jsonb_build_object('status', v_new_status::text));

  return jsonb_build_object('success', true, 'status', v_new_status::text);
end;
$$;

-- 7. RPC: admin_delete_candidate
create or replace function admin_delete_candidate(
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cand_name text;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  select name into v_cand_name from public.candidates where id = p_id;
  if v_cand_name is null then
    return jsonb_build_object('success', false, 'error', 'Candidate not found.');
  end if;

  delete from public.candidates where id = p_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'candidate.admin_delete', 'candidate', p_id, jsonb_build_object('name', v_cand_name));

  return jsonb_build_object('success', true);
end;
$$;

-- 8. RPC: admin_get_users
create or replace function admin_get_users()
returns table (
  id uuid,
  display_name text,
  role user_role,
  created_at timestamptz,
  linked_candidate_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      p.id,
      p.display_name,
      p.role,
      p.created_at,
      c.name as linked_candidate_name
    from public.profiles p
    left join public.candidates c on c.profile_id = p.id
    order by p.created_at desc;
end;
$$;

-- 9. RPC: admin_update_user_role
create or replace function admin_update_user_role(
  p_user_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new_role user_role;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  v_new_role := case
    when p_role = 'admin' then 'admin'::user_role
    when p_role = 'candidate' then 'candidate'::user_role
    else 'student'::user_role
  end;

  update public.profiles
  set role = v_new_role
  where id = p_user_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User profile not found.');
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'user.role_change', 'profile', p_user_id, jsonb_build_object('new_role', v_new_role::text));

  return jsonb_build_object('success', true);
end;
$$;

-- 10. RPC: admin_get_audit_logs
create or replace function admin_get_audit_logs(
  p_limit int default 50
)
returns table (
  id uuid,
  actor_id uuid,
  actor_name text,
  action text,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      a.id,
      a.actor_id,
      coalesce(p.display_name, 'System') as actor_name,
      a.action,
      a.entity_type,
      a.entity_id,
      a.details,
      a.created_at
    from public.audit_logs a
    left join public.profiles p on p.id = a.actor_id
    order by a.created_at desc
    limit greatest(1, least(p_limit, 200));
end;
$$;

-- 11. RPC: admin_get_all_questions
create or replace function admin_get_all_questions()
returns table (
  id uuid,
  question text,
  moderation_status moderation_status,
  created_at timestamptz,
  issue_id uuid,
  issue_title text,
  submitter_id uuid,
  submitter_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      q.id,
      q.question,
      q.moderation_status,
      q.created_at,
      q.issue_id,
      i.title as issue_title,
      q.submitter_id,
      coalesce(p.display_name, 'Anonymous Student') as submitter_name
    from public.questions q
    left join public.issues i on i.id = q.issue_id
    left join public.profiles p on p.id = q.submitter_id
    order by q.created_at desc;
end;
$$;

-- Grant execution to authenticated users (role checked inside each function)
grant execute on function admin_get_all_candidates() to authenticated;
grant execute on function admin_create_candidate(text, uuid, int, text, text, text, text, text, text) to authenticated;
grant execute on function admin_update_candidate(uuid, text, uuid, int, text, text, text, text, text, text) to authenticated;
grant execute on function admin_toggle_verify_candidate(uuid, text) to authenticated;
grant execute on function admin_delete_candidate(uuid) to authenticated;
grant execute on function admin_get_users() to authenticated;
grant execute on function admin_update_user_role(uuid, text) to authenticated;
grant execute on function admin_get_audit_logs(int) to authenticated;
grant execute on function admin_get_all_questions() to authenticated;
