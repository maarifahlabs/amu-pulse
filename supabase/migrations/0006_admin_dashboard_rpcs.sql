-- Migration: Admin dashboard RPCs (Fixed ambiguous column references)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. RPC: Fetch pending claims for admin dashboard
create or replace function admin_get_pending_claims()
returns table (
  id uuid,
  evidence text,
  created_at timestamptz,
  candidate_id uuid,
  candidate_name text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
begin
  select (p.role = 'admin') into v_is_admin from profiles p where p.id = v_uid;
  if not coalesce(v_is_admin, false) then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      cc.id,
      cc.evidence,
      cc.created_at,
      cc.candidate_id,
      c.name as candidate_name
    from candidate_claims cc
    left join candidates c on c.id = cc.candidate_id
    where cc.status = 'pending'
    order by cc.created_at desc;
end;
$$;

-- 2. RPC: Fetch pending questions for admin dashboard
create or replace function admin_get_pending_questions()
returns table (
  id uuid,
  question text,
  created_at timestamptz,
  issue_title text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
begin
  select (p.role = 'admin') into v_is_admin from profiles p where p.id = v_uid;
  if not coalesce(v_is_admin, false) then
    raise exception 'Access denied: Admin role required.';
  end if;

  return query
    select
      q.id,
      q.question,
      q.created_at,
      i.title as issue_title
    from questions q
    left join issues i on i.id = q.issue_id
    where q.moderation_status = 'pending'
    order by q.created_at desc;
end;
$$;

-- 3. RPC: Admin approve/reject questions
create or replace function admin_review_question(
  p_question_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean;
  v_question record;
begin
  select (p.role = 'admin') into v_is_admin from profiles p where p.id = v_uid;
  if not coalesce(v_is_admin, false) then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  select * into v_question from questions q where q.id = p_question_id;
  if v_question is null or v_question.moderation_status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Question not found or not pending.');
  end if;

  if p_decision = 'approve' then
    update questions set moderation_status = 'approved' where id = p_question_id;
  else
    update questions set moderation_status = 'rejected' where id = p_question_id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'question.' || p_decision, 'question', p_question_id, '{}'::jsonb);

  return jsonb_build_object('success', true);
end;
$$;

-- 4. Grant permissions
grant execute on function admin_get_pending_claims() to authenticated;
grant execute on function admin_get_pending_questions() to authenticated;
grant execute on function admin_review_question(uuid, text) to authenticated;
