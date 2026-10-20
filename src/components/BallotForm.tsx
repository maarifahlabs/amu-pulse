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
  const initial: Record<string, string[]> = {};
  for (const group of groups) {
    initial[group.id] = group.options.map((option) => option.id).filter((id) => selected.includes(id));
  }
  const [picked, setPicked] = useState(initial);
  const chosen = Object.values(picked).flat();

  function toggle(group: BallotGroup, id: string) {
    setPicked((prev) => {
      const current = prev[group.id] ?? [];
      if (current.includes(id)) {
        return { ...prev, [group.id]: current.filter((item) => item !== id) };
      }
      if (group.limit === 1) return { ...prev, [group.id]: [id] };
      if (current.length >= group.limit) {
        window.alert(`You can choose up to ${group.limit} candidates for ${group.title}.`);
        return prev;
      }
      return { ...prev, [group.id]: [...current, id] };
    });
  }

  return (
    <form action={saveVote} className="space-y-4">
      {chosen.map((id) => (
        <input key={id} type="hidden" name="candidateId" value={id} />
      ))}
      {groups.map((group) => {
        const current = picked[group.id] ?? [];
        return (
          <fieldset key={group.id} className="card space-y-2">
            <legend className="flex w-full items-baseline justify-between gap-3">
              <span className="text-lg font-bold">{group.title}</span>
              <span className="text-xs font-medium text-slate-500">
                {group.limit === 1 ? "Choose 1" : `${current.length} of ${group.limit} selected`}
              </span>
            </legend>
            <div className="space-y-2">
              {group.options.map((option) => {
                const on = current.includes(option.id);
                return (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 ${on ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}>
                    <input
                      type={group.limit === 1 ? "radio" : "checkbox"}
                      name={`choice-${group.id}`}
                      checked={on}
                      onChange={() => toggle(group, option.id)}
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
            {group.limit === 1 && current.length > 0 && (
              <button type="button" className="text-sm font-medium text-slate-600 underline" onClick={() => setPicked((prev) => ({ ...prev, [group.id]: [] }))}>
                Clear choice
              </button>
            )}
          </fieldset>
        );
      })}
      <SubmitButton className="btn-primary w-full sm:w-auto" pendingLabel="Saving…">Submit</SubmitButton>
    </form>
  );
}
