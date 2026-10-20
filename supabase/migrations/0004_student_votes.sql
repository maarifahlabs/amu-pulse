-- Personal student ballots. Each account can replace its own choices.
-- No public policies: only the service role reads or writes this table.

create table if not exists student_votes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  position_id uuid not null references positions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, candidate_id)
);

create index if not exists student_votes_profile_idx on student_votes(profile_id);

alter table student_votes enable row level security;

revoke select, insert, update, delete on student_votes from anon, authenticated;
