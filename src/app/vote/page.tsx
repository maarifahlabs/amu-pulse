import type { Metadata } from "next";
import Link from "next/link";
import { BallotForm } from "@/components/BallotForm";
import { FlashMessage } from "@/components/FlashMessage";
import { requireViewer } from "@/lib/auth";
import { getDataset } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { voteLimit } from "@/lib/voting";

export const metadata: Metadata = { title: "Vote", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function VotePage({ searchParams }: { searchParams: SearchParams }) {
  const { ok, error } = await searchParams;

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Vote</h1>
        <p className="text-sm text-slate-600">
          Submit each post on its own. Choose one candidate for a post, or up to 10 for Cabinet Member, then press Submit on that post. You can change any post later. This is your selection on AMU Pulse. The official vote is still cast in person on 5 November.
        </p>
      </header>
      <FlashMessage ok={ok} error={error} />
      {!isSupabaseConfigured ? (
        <p className="card text-sm">Voting needs Supabase to be configured.</p>
      ) : (
        <Ballot />
      )}
    </div>
  );
}

async function Ballot() {
  const viewer = await requireViewer("/vote");
  const ds = await getDataset();
  const { data } = await createAdminClient()
    .from("student_votes")
    .select("candidate_id")
    .eq("profile_id", viewer.id);
  const selected = (data ?? []).map((row) => row.candidate_id as string);

  const groups = ds.positions
    .map((position) => ({
      id: position.id,
      title: position.title,
      limit: voteLimit(position.slug),
      options: ds.candidates
        .filter((candidate) => candidate.position_id === position.id)
        .map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          serial: candidate.ballot_number == null ? "" : String(candidate.ballot_number).padStart(2, "0"),
          faculty: candidate.faculty,
        })),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <>
      <p className="text-sm text-slate-600">
        Signed in as {viewer.email}.{" "}
        <Link href="/candidate/dashboard#votes" className="font-medium text-brand-700 underline">View your current vote</Link>
      </p>
      <BallotForm groups={groups} selected={selected} />
    </>
  );
}
