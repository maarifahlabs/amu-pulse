const STEPS = [
  "Find your profile",
  "Claim this profile",
  "Submit verification",
  "Admin verifies",
  "Profile claimed",
];

export function ClaimSteps({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const state = step < current ? "done" : step === current ? "current" : "upcoming";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              state === "current"
                ? "bg-brand-600 text-white"
                : state === "done"
                  ? "bg-brand-50 text-brand-800"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="mr-1">{step}.</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
