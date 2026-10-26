-- Migration: 0007_candidate_creation_permissions.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Fixes error: 42501 permission denied for table candidates / profiles

-- 1. Grant table permissions to authenticated users
grant select, insert, update on public.candidates to authenticated;
grant select, update on public.profiles to authenticated;

-- 2. Candidates RLS Policies
-- Allow authenticated users to insert their own candidate profile
drop policy if exists "Authenticated users can create candidate profile" on public.candidates;
create policy "Authenticated users can create candidate profile"
on public.candidates
for insert
to authenticated
with check (
  auth.uid() = profile_id
);

-- Allow candidates to update their own profile (bio, department, faculty, photo_url)
drop policy if exists "Candidates can update own candidate profile" on public.candidates;
create policy "Candidates can update own candidate profile"
on public.candidates
for update
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

-- Allow candidates to read their own profile even if pending/unverified
drop policy if exists "Candidates can select own profile" on public.candidates;
create policy "Candidates can select own profile"
on public.candidates
for select
to authenticated
using (auth.uid() = profile_id);

-- 3. Profiles RLS Policies
-- Allow authenticated users to update their own profile (display_name, role)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
