-- RPCs for pure client-side React app (eliminating Node.js server actions)
-- All functions run with SECURITY DEFINER to enforce security boundaries in Postgres directly.

-- 0. Public candidate vote counts (anonymized totals without exposing student voter profile_ids)
create or replace function get_candidate_vote_counts()
returns table (candidate_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
as $$
  select candidate_id, count(*)::bigint as vote_count
  from student_votes
  group by candidate_id;
$$;

grant execute on function get_candidate_vote_counts() to anon, authenticated;

-- 1. Student voting
create or replace function submit_student_vote(
  p_position_id uuid,
  p_candidate_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_pos_slug text;
  v_limit int;
  v_cid uuid;
  v_cand_count int;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'You must be logged in to vote.');
  end if;

  select slug into v_pos_slug from positions where id = p_position_id;
  if v_pos_slug is null then
    return jsonb_build_object('success', false, 'error', 'Invalid position.');
  end if;

  v_limit := case when v_pos_slug = 'cabinet-member' then 10 else 1 end;

  if array_length(p_candidate_ids, 1) is null or array_length(p_candidate_ids, 1) = 0 then
    return jsonb_build_object('success', false, 'error', 'Please select at least one candidate.');
  end if;

  if array_length(p_candidate_ids, 1) > v_limit then
    return jsonb_build_object('success', false, 'error', 'Too many candidates selected for this post.');
  end if;

  select count(*) into v_cand_count
  from candidates
  where id = any(p_candidate_ids)
    and position_id = p_position_id
    and verification_status = 'verified';

  if v_cand_count <> array_length(p_candidate_ids, 1) then
    return jsonb_build_object('success', false, 'error', 'Some selected candidates are invalid or do not belong to this position.');
  end if;

  delete from student_votes
  where profile_id = v_uid and position_id = p_position_id;

  foreach v_cid in array p_candidate_ids loop
    insert into student_votes (profile_id, candidate_id, position_id, updated_at)
    values (v_uid, v_cid, p_position_id, now());
  end loop;

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'vote.save', 'profile', v_uid, jsonb_build_object('position_id', p_position_id, 'count', array_length(p_candidate_ids, 1)));

  return jsonb_build_object('success', true, 'count', array_length(p_candidate_ids, 1));
end;
$$;

-- 2. Student Question Submission
create or replace function submit_student_question(
  p_issue_id uuid,
  p_question text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_recent_count int;
  v_qid uuid;
  v_clean_q text := trim(p_question);
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'You must be logged in to submit a question.');
  end if;

  if length(v_clean_q) < 10 or length(v_clean_q) > 500 then
    return jsonb_build_object('success', false, 'error', 'Question must be between 10 and 500 characters.');
  end if;

  if not exists (select 1 from issues where id = p_issue_id and status = 'published') then
    return jsonb_build_object('success', false, 'error', 'This issue is not open for questions.');
  end if;

  select count(*) into v_recent_count
  from questions
  where submitter_id = v_uid
    and created_at >= (now() - interval '24 hours');

  if v_recent_count >= 5 then
    return jsonb_build_object('success', false, 'error', 'Daily question limit reached (max 5 per day).');
  end if;

  insert into questions (issue_id, submitter_id, question, moderation_status)
  values (p_issue_id, v_uid, v_clean_q, 'pending')
  returning id into v_qid;

  insert into audit_logs (actor_id, action, entity_type, entity_id)
  values (v_uid, 'question.submit', 'question', v_qid);

  return jsonb_build_object('success', true, 'id', v_qid);
end;
$$;

-- 3. Candidate Claim Submission
create or replace function submit_candidate_claim(
  p_candidate_id uuid,
  p_evidence text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_claim_id uuid;
  v_profile_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'You must be logged in.');
  end if;

  select profile_id into v_profile_id from candidates where id = p_candidate_id;
  if v_profile_id is not null then
    return jsonb_build_object('success', false, 'error', 'This profile is already claimed.');
  end if;

  if exists (select 1 from candidate_claims where profile_id = v_uid and candidate_id <> p_candidate_id and status = 'pending') then
    return jsonb_build_object('success', false, 'error', 'You already have another pending claim.');
  end if;

  insert into candidate_claims (candidate_id, profile_id, evidence, status)
  values (p_candidate_id, v_uid, p_evidence, 'pending')
  on conflict (candidate_id, profile_id)
  do update set evidence = excluded.evidence, status = 'pending', reviewed_by = null, reviewed_at = null
  returning id into v_claim_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'claim.submit', 'candidate_claim', v_claim_id, jsonb_build_object('candidate_id', p_candidate_id));

  return jsonb_build_object('success', true, 'claim_id', v_claim_id);
end;
$$;

-- 4. Candidate Answer Submission
create or replace function submit_candidate_answer(
  p_issue_id uuid,
  p_answer text,
  p_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_candidate_id uuid;
  v_clean_ans text := trim(p_answer);
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated.');
  end if;

  select id into v_candidate_id from candidates where profile_id = v_uid;
  if v_candidate_id is null then
    return jsonb_build_object('success', false, 'error', 'No candidate profile linked to this account.');
  end if;

  if length(v_clean_ans) < 5 or length(v_clean_ans) > 2000 then
    return jsonb_build_object('success', false, 'error', 'Answer must be between 5 and 2000 characters.');
  end if;

  insert into candidate_answers (candidate_id, issue_id, answer, source_url, status, updated_at)
  values (v_candidate_id, p_issue_id, v_clean_ans, p_source_url, 'published', now())
  on conflict (candidate_id, issue_id)
  do update set answer = excluded.answer, source_url = excluded.source_url, status = 'published', updated_at = now();

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'answer.submit', 'candidate_answer', v_candidate_id, jsonb_build_object('issue_id', p_issue_id));

  return jsonb_build_object('success', true);
end;
$$;

-- 5. Candidate Manifesto Submission
create or replace function submit_candidate_manifesto(
  p_content text,
  p_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_candidate_id uuid;
  v_clean_content text := trim(p_content);
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated.');
  end if;

  select id into v_candidate_id from candidates where profile_id = v_uid;
  if v_candidate_id is null then
    return jsonb_build_object('success', false, 'error', 'No candidate profile linked to this account.');
  end if;

  if length(v_clean_content) < 10 then
    return jsonb_build_object('success', false, 'error', 'Manifesto is too short.');
  end if;

  insert into manifestos (candidate_id, content, source_url, status, submitted_at, published_at)
  values (v_candidate_id, v_clean_content, p_source_url, 'published', now(), now());

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'manifesto.submit', 'manifesto', v_candidate_id);

  return jsonb_build_object('success', true);
end;
$$;

-- 6. Candidate Bio Update
create or replace function submit_candidate_bio(
  p_bio text,
  p_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_candidate_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated.');
  end if;

  select id into v_candidate_id from candidates where profile_id = v_uid;
  if v_candidate_id is null then
    return jsonb_build_object('success', false, 'error', 'No candidate profile linked to this account.');
  end if;

  update candidates
  set bio = p_bio,
      photo_url = coalesce(p_photo_url, photo_url),
      updated_at = now()
  where id = v_candidate_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id)
  values (v_uid, 'profile.update', 'candidate', v_candidate_id);

  return jsonb_build_object('success', true);
end;
$$;

-- 7. Admin Claim Review
create or replace function admin_review_claim(
  p_claim_id uuid,
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
  v_claim record;
begin
  select (role = 'admin') into v_is_admin from profiles where id = v_uid;
  if not coalesce(v_is_admin, false) then
    return jsonb_build_object('success', false, 'error', 'Access denied: Admin role required.');
  end if;

  select * into v_claim from candidate_claims where id = p_claim_id;
  if v_claim is null or v_claim.status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Claim not found or not pending.');
  end if;

  if p_decision = 'approve' then
    update candidates set profile_id = v_claim.profile_id where id = v_claim.candidate_id and profile_id is null;
    update profiles set role = 'candidate' where id = v_claim.profile_id and role = 'student';
    update candidate_claims set status = 'approved', reviewed_by = v_uid, reviewed_at = now() where id = p_claim_id;
    update candidate_claims set status = 'rejected', reviewed_by = v_uid, reviewed_at = now()
    where candidate_id = v_claim.candidate_id and status = 'pending';
  else
    update candidate_claims set status = 'rejected', reviewed_by = v_uid, reviewed_at = now() where id = p_claim_id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, details)
  values (v_uid, 'claim.' || p_decision, 'candidate_claim', p_claim_id, jsonb_build_object('candidate_id', v_claim.candidate_id));

  return jsonb_build_object('success', true);
end;
$$;

-- Grant execute permissions to authenticated users
grant execute on function submit_student_vote(uuid, uuid[]) to authenticated;
grant execute on function submit_student_question(uuid, text) to authenticated;
grant execute on function submit_candidate_claim(uuid, text) to authenticated;
grant execute on function submit_candidate_answer(uuid, text, text) to authenticated;
grant execute on function submit_candidate_manifesto(text, text) to authenticated;
grant execute on function submit_candidate_bio(text, text) to authenticated;
grant execute on function admin_review_claim(uuid, text) to authenticated;

-- Allow authenticated users to view their own votes
drop policy if exists "Own student votes" on student_votes;
create policy "Own student votes" on student_votes
  for select to authenticated using (auth.uid() = profile_id);

-- Allow authenticated users to view their own claims
drop policy if exists "Own claims" on candidate_claims;
create policy "Own claims" on candidate_claims
  for select to authenticated using (auth.uid() = profile_id);
