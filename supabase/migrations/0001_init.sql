-- AMU Pulse core schema.
-- Public reads go through RLS + column grants. All writes happen in role-checked
-- server actions using the service-role key, so no insert/update/delete policies
-- exist for anon or authenticated users.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Controlled vocabularies
-- ---------------------------------------------------------------------------
create type user_role as enum ('student', 'candidate', 'admin');
create type verification_status as enum ('unverified', 'verified', 'rejected');
create type issue_status as enum ('draft', 'published', 'archived');
create type submission_status as enum ('pending', 'published', 'rejected');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type claim_status as enum ('pending', 'approved', 'rejected');
create type election_event_kind as enum ('milestone', 'polling', 'notice');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table positions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Nullable until the candidate claims (and an admin approves) the profile.
  profile_id uuid unique references profiles(id) on delete set null,
  position_id uuid not null references positions(id),
  -- Official ballot serial number; used as the neutral display order.
  ballot_number int check (ballot_number > 0),
  name text not null,
  department text,
  faculty text,
  bio text,
  photo_url text,
  -- Candidate-submitted changes wait here until an admin approves them.
  bio_pending text,
  photo_pending_url text,
  profile_update_status submission_status,
  -- 'verified' means confirmed against the official candidate list.
  verification_status verification_status not null default 'unverified',
  official_source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position_id, ballot_number)
);
create index candidates_position_idx on candidates(position_id);

create table candidate_claims (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  evidence text not null,
  status claim_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (candidate_id, profile_id)
);

create table manifestos (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  content text not null,
  source_url text,
  status submission_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  published_at timestamptz
);
create index manifestos_candidate_idx on manifestos(candidate_id);

create table issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  context text,
  category text not null,
  status issue_status not null default 'draft',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table candidate_answers (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  issue_id uuid not null references issues(id) on delete cascade,
  answer text not null,
  source_url text,
  status submission_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (candidate_id, issue_id)
);
create index candidate_answers_issue_idx on candidate_answers(issue_id);

create table questions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  -- Never exposed publicly (see column grants below).
  submitter_id uuid references profiles(id) on delete set null,
  question text not null check (char_length(question) between 10 and 500),
  moderation_status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index questions_issue_idx on questions(issue_id);
create index questions_submitter_idx on questions(submitter_id, created_at);

create table election_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind election_event_kind not null default 'milestone',
  starts_at timestamptz not null,
  -- Every official announcement keeps its original source.
  source_url text not null,
  -- Only events checked against the source by an admin are public.
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_updated_at before update on candidates
  for each row execute function set_updated_at();
create trigger candidate_answers_updated_at before update on candidate_answers
  for each row execute function set_updated_at();

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table positions enable row level security;
alter table candidates enable row level security;
alter table candidate_claims enable row level security;
alter table manifestos enable row level security;
alter table issues enable row level security;
alter table candidate_answers enable row level security;
alter table questions enable row level security;
alter table election_events enable row level security;
alter table audit_logs enable row level security;

create policy "Own profile" on profiles
  for select to authenticated using (auth.uid() = id);

create policy "Public positions" on positions
  for select to anon, authenticated using (true);

create policy "Public verified candidates" on candidates
  for select to anon, authenticated using (verification_status = 'verified');

create policy "Public published manifestos" on manifestos
  for select to anon, authenticated using (
    status = 'published'
    and exists (
      select 1 from candidates c
      where c.id = candidate_id and c.verification_status = 'verified'
    )
  );

create policy "Public published issues" on issues
  for select to anon, authenticated using (status = 'published');

create policy "Public published answers" on candidate_answers
  for select to anon, authenticated using (
    status = 'published'
    and exists (
      select 1 from issues i where i.id = issue_id and i.status = 'published'
    )
    and exists (
      select 1 from candidates c
      where c.id = candidate_id and c.verification_status = 'verified'
    )
  );

create policy "Public approved questions" on questions
  for select to anon, authenticated using (moderation_status = 'approved');

create policy "Public verified election events" on election_events
  for select to anon, authenticated using (verified_at is not null);

-- candidate_claims and audit_logs intentionally have no policies:
-- only the service role can read or write them.

-- ---------------------------------------------------------------------------
-- Column-level grants: hide pending/private columns from the public API.
-- ---------------------------------------------------------------------------
revoke select on candidates from anon, authenticated;
grant select (
  id, slug, profile_id, position_id, ballot_number, name, department, faculty, bio, photo_url,
  verification_status, official_source_url, created_at, updated_at
) on candidates to anon, authenticated;

revoke select on questions from anon, authenticated;
grant select (id, issue_id, question, moderation_status, created_at)
  on questions to anon, authenticated;

revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for approved candidate photos (writes via service role).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('candidate-photos', 'candidate-photos', true)
on conflict (id) do nothing;
