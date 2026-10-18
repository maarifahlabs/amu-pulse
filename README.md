# AMU Pulse

**Your Campus. Your Questions. Your Choice.**

An independent, nonpartisan, mobile-first platform for the AMU Students' Union election. The central object is
the **campus issue**: students see each issue, every verified candidate's published response (or "Awaiting
response"), and can compare candidates side by side.

AMU Pulse is not affiliated with AMU. It does not run voting, polls or predictions and never collects voting
intentions.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage, RLS) ·
Zod · Vercel.

## Quick start (demo mode)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Without Supabase credentials the site runs read-only with clearly labeled fictional sample data.

## Connect Supabase

1. Create a Supabase project.
2. In the SQL editor run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in the URL, anon key and service-role key.
4. In Supabase Auth → URL configuration, set the Site URL and add `<site>/auth/callback` as a redirect URL.
5. Log in once at `/login`, then make yourself admin:

   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

6. Open `/admin/dashboard`. Verify the seeded election dates against the official Registrar notices before
   publishing them. They are inserted unverified and stay hidden until you do.

## How content flows

| Who | Does | Becomes public when |
| --- | --- | --- |
| Admin | Creates positions, candidates (from the official list), issues, election dates | Candidate marked *verified*; issue *published*; event *verified against source* |
| Candidate | Claims profile, submits bio/photo, manifesto, answers | Admin approves claim, then each submission |
| Student | Browses freely; logs in only to submit a question | Admin approves the question (submitter never shown) |

Editing a published answer sends it back to review. Every write is recorded in `audit_logs`.

## Security model

- All writes run in server actions that check the session and role, then use the service-role client.
- Anon/authenticated roles have **no** insert/update/delete rights; RLS only exposes published, verified rows.
- Column grants hide `candidates.bio_pending`, `photo_pending_url`, `profile_update_status` and
  `questions.submitter_id` from the public API.
- `SUPABASE_SERVICE_ROLE_KEY` is imported only via `server-only` modules.
- Question spam controls: login required, honeypot field, 5 per user per day, moderation queue.

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Countdown, featured issues, key dates |
| `/issues`, `/issues/[slug]` | Issue explorer and Issue-to-Answer page with share buttons |
| `/api/card/issue/[slug]` | 1200×630 share card (with QR code) used for link previews and downloads |
| `/candidates`, `/candidates/[slug]` | Directory and profile with completeness checklist (not a score) |
| `/compare?position=president&candidates=a,b` | Equal side-by-side comparison |
| `/election-guide` | Verified dates and positions |
| `/poster` | Printable QR poster |
| `/candidate/dashboard`, `/admin/dashboard` | Candidate and admin workflows |

## Deploy

Push to GitHub, import in Vercel, set the four environment variables (with `NEXT_PUBLIC_SITE_URL` set to the
production URL) and deploy.

## Before launch

- Review the AMU Students' Union election regulations.
- Don't use official AMU logos or imply endorsement.
- Confirm every date and candidate against official notices and keep their source URLs.
