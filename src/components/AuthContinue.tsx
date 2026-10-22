"use client";

import { useEffect, useRef } from "react";
import { completeMagicLink } from "@/actions/auth";

export function AuthContinue({
  code,
  tokenHash,
  type,
  next,
}: {
  code: string;
  tokenHash: string;
  type: string;
  next: string;
}) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const key = `amu-auth-${code || tokenHash}`;
    if (!key || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    form.current?.requestSubmit();
  }, [code, tokenHash]);

  return (
    <form ref={form} action={completeMagicLink} className="card space-y-3">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next} />
      <p className="text-sm text-slate-600">Signing you in…</p>
      <button className="btn-primary w-full">Continue</button>
    </form>
  );
}
