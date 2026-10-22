"use client";

import { useState } from "react";
import { saveVote } from "@/actions/votes";
import { SubmitButton } from "@/components/SubmitButton";

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

export function BallotForm({ groups, selected }: { groups: BallotGroup[]; selected: string[] }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PostBallot key={group.id} group={group} selected={selected} />
      ))}
    </div>
  );
}

function PostBallot({ group, selected }: { group: BallotGroup; selected: string[] }) {
  const [picked, setPicked] = useState(
    group.options.map((option) => option.id).filter((id) => selected.includes(id)),
  );

  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (group.limit === 1) return [id];
      if (current.length >= group.limit) {
        window.alert(`You can choose up to ${group.limit} candidates for ${group.title}.`);
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <form id={`post-${group.id}`} action={saveVote} className="card scroll-mt-20 space-y-3">
      <input type="hidden" name="positionId" value={group.id} />
      {picked.map((id) => (
        <input key={id} type="hidden" name="candidateId" value={id} />
      ))}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{group.title}</h2>
        <span className="text-xs font-medium text-slate-500">
          {group.limit === 1 ? "Choose 1" : `${picked.length} of ${group.limit} selected`}
        </span>
      </div>
      <div className="space-y-2">
        {group.options.map((option) => {
          const on = picked.includes(option.id);
          return (
            <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${on ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}>
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
      {group.limit === 1 && picked.length > 0 && (
        <button type="button" className="text-sm font-medium text-slate-600 underline" onClick={() => setPicked([])}>
          Clear choice
        </button>
      )}
      <SubmitButton className="btn-primary w-full sm:w-auto" pendingLabel="Saving…">Submit</SubmitButton>
    </form>
  );
}
