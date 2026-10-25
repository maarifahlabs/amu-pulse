-- ==============================================================================
-- Run this in your Supabase Dashboard SQL Editor to allow authenticated students
-- to directly submit and manage their votes in production (Vercel & GitHub Pages)
-- ==============================================================================

-- 1. Grant table access to authenticated users
grant select, insert, delete on student_votes to authenticated;

-- 2. Ensure students can only insert, select, and delete their own votes
drop policy if exists "Students can manage own votes" on student_votes;

create policy "Students can manage own votes" on student_votes
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
