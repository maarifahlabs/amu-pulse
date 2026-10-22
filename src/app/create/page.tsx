import type { Metadata } from "next";
import Link from "next/link";
import { createCandidateProfile } from "@/actions/candidates";
import { FlashMessage } from "@/components/FlashMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { requireViewer } from "@/lib/auth";
import { getDataset } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Create your profile", robots: { index: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function CreateProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, error } = await searchParams;
  if (!isSupabaseConfigured) {
    return <div className="container-page py-12"><p className="card">Creating a profile needs Supabase to be configured.</p></div>;
  }

  const viewer = await requireViewer("/create");
  const db = createAdminClient();
  const { data: existing } = await db.from("candidates").select("slug").eq("profile_id", viewer.id).maybeSingle();
  const ds = await getDataset();

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Create your profile</h1>
        <p className="text-sm text-slate-600">
          Add yourself as a candidate. If your name is already on the list, open that candidate and choose Claim this profile instead.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
      {existing ? (
        <p className="card text-sm">
          This account already has a profile. <Link href="/candidate/dashboard" className="font-semibold text-brand-700 underline">Open your account</Link>
        </p>
      ) : (
        <form action={createCandidateProfile} className="card space-y-4">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" name="name" required minLength={2} maxLength={120} className="input" />
          </div>
          <div>
            <label htmlFor="positionId" className="label">Post</label>
            <select id="positionId" name="positionId" required className="input" defaultValue="">
              <option value="" disabled>Choose a post</option>
              {ds.positions.map((position) => (
                <option key={position.id} value={position.id}>{position.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="department" className="label">Department (optional)</label>
            <input id="department" name="department" maxLength={120} className="input" />
          </div>
          <div>
            <label htmlFor="faculty" className="label">Faculty (optional)</label>
            <input id="faculty" name="faculty" maxLength={120} className="input" />
          </div>
          <div>
            <label htmlFor="bio" className="label">Bio</label>
            <textarea id="bio" name="bio" required minLength={20} maxLength={2000} rows={5} className="input" />
          </div>
          <SubmitButton className="btn-primary" pendingLabel="Creating…">Create profile</SubmitButton>
        </form>
      )}
    </div>
  );
}
