import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/hooks/useDataset";

export interface BallotOption {
  id: string;
  name: string;
  serial: string;
  faculty: string | null;
}

export interface BallotGroup {
  id: string;
  title: string;
  limit: number;
  options: BallotOption[];
}

export function BallotForm({
  groups,
  selected,
  onVoteSaved,
}: {
  groups: BallotGroup[];
  selected: string[];
  onVoteSaved?: () => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PostBallot key={group.id} group={group} selected={selected} onVoteSaved={onVoteSaved} />
      ))}
    </div>
  );
}

function PostBallot({
  group,
  selected,
  onVoteSaved,
}: {
  group: BallotGroup;
  selected: string[];
  onVoteSaved?: () => void;
}) {
  const { user } = useAuth();
  const { incrementVoteCount } = useDataset();
  const [picked, setPicked] = useState(
    group.options.map((option) => option.id).filter((id) => selected.includes(id))
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function toggle(id: string) {
    setMessage(null);
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (group.limit === 1) return [id];
      if (current.length >= group.limit) {
        alert(`You can choose up to ${group.limit} candidates for ${group.title}.`);
        return current;
      }
      return [...current, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMessage({ type: "error", text: "Please sign in to save your vote." });
      return;
    }

    if (picked.length === 0) {
      setMessage({ type: "error", text: `Please choose a candidate for ${group.title}.` });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let saved = false;

      // 1. Try local dev voting endpoint first (runs seamlessly in dev without database changes)
      try {
        const devRes = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: user.id,
            position_id: group.id,
            candidate_ids: picked,
          }),
        });
        if (devRes.ok) {
          const json = await devRes.json();
          if (json.success) saved = true;
        }
      } catch {
        // Dev endpoint not available (e.g. production static CDN)
      }

      // 2. Direct client delete + insert fallback (for production with RLS)
      if (!saved) {
        const { error: deleteError } = await supabase
          .from("student_votes")
          .delete()
          .eq("profile_id", user.id)
          .eq("position_id", group.id);

        if (!deleteError) {
          const { error: insertError } = await supabase
            .from("student_votes")
            .insert(
              picked.map((id) => ({
                profile_id: user.id,
                candidate_id: id,
                position_id: group.id,
              }))
            );

          if (!insertError) saved = true;
        }
      }

      if (saved) {
        setMessage({ type: "ok", text: `Your vote for ${group.title} has been saved!` });
        for (const cid of picked) {
          incrementVoteCount(cid);
        }
        if (onVoteSaved) onVoteSaved();
      } else {
        setMessage({
          type: "error",
          text: "Could not save vote. If running in production, please execute the 3-line SQL permission in Supabase.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Vote submission failed." });
    } finally {
      setSubmitting(false);
    }
  }

  const isVoted = group.options.some((option) => selected.includes(option.id));

  return (
    <form id={`post-${group.id}`} onSubmit={handleSubmit} className="card scroll-mt-20 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{group.title}</h2>
        {isVoted ? (
          <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Saved ✅
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {group.limit === 1 ? "Choose 1" : `${picked.length} of ${group.limit} selected`}
          </span>
        )}
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {group.options.map((option) => {
          const on = picked.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                on ? "border-brand-600 bg-brand-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type={group.limit === 1 ? "radio" : "checkbox"}
                name={`choice-${group.id}`}
                checked={on}
                onChange={() => toggle(option.id)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="min-w-0">
                <span className="block font-medium">{option.name}</span>
                <span className="block text-xs text-slate-500">
                  {option.serial ? `Serial ${option.serial}` : "Serial not allotted yet"}
                  {option.faculty ? ` · ${option.faculty}` : ""}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        {group.limit === 1 && picked.length > 0 && (
          <button
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-800 underline"
            onClick={() => setPicked([])}
          >
            Clear choice
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full sm:w-auto ml-auto"
        >
          {submitting ? "Saving vote…" : "Save Vote"}
        </button>
      </div>
    </form>
  );
}
