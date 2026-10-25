import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BallotForm } from "@/components/BallotForm";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/hooks/useDataset";
import { supabase } from "@/lib/supabase";
import { voteLimit } from "@/lib/voting";

export function VotePage() {
  const { user, loading: authLoading } = useAuth();
  const { dataset: ds, loading: dataLoading, refresh } = useDataset();
  const [selected, setSelected] = useState<string[]>([]);
  const [votesLoading, setVotesLoading] = useState(false);

  async function loadUserVotes(userId: string) {
    setVotesLoading(true);
    try {
      // 1. Try dev endpoint (in local dev mode)
      try {
        const devRes = await fetch(`/api/my-votes?profile_id=${userId}`);
        if (devRes.ok) {
          const rows = await devRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            setSelected(rows.map((row: any) => row.candidate_id as string));
            return;
          }
        }
      } catch {
        // Dev endpoint not available
      }

      // 2. Direct client query (production)
      const { data, error } = await supabase
        .from("student_votes")
        .select("candidate_id")
        .eq("profile_id", userId);

      if (!error && data) {
        setSelected(data.map((row: any) => row.candidate_id as string));
      }
    } finally {
      setVotesLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadUserVotes(user.id);
    } else {
      setSelected([]);
    }
  }, [user?.id]);

  if (authLoading || dataLoading || !ds) {
    return (
      <div className="container-page py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" />
        <p className="mt-4 text-sm text-slate-600 font-medium">Loading your ballot…</p>
      </div>
    );
  }

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
          faculty: candidate.faculty || candidate.department,
        })),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <div className="container-page space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl font-display">Vote</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Submit each post on its own. Choose one candidate for a post, or up to 10 for Cabinet Member, then press Submit on that post. You can change any post later. This is your selection on AMU Pulse. The official vote is still cast in person on 5 November.
        </p>
      </header>

      {!user ? (
        <div className="card bg-brand-50/50 border-brand-200 text-center py-10 space-y-3">
          <p className="text-base font-semibold text-brand-900">Sign in to save your personal ballot</p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You can vote once for each post. Your individual vote is strictly private and never shared publicly.
          </p>
          <Link to="/login?next=/vote" className="btn-primary inline-flex">
            Sign in with Google
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>Signed in as <span className="font-semibold text-slate-900">{user.email}</span></p>
            <Link to="/candidate/dashboard#votes" className="font-medium text-brand-700 hover:underline">
              View your current votes →
            </Link>
          </div>

          {votesLoading ? (
            <p className="card text-sm text-slate-500 animate-pulse">Loading previous choices…</p>
          ) : (
            <BallotForm
              groups={groups}
              selected={selected}
              onVoteSaved={() => {
                if (user?.id) loadUserVotes(user.id);
                refresh();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
