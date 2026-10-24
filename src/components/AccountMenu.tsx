"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/actions/auth";

interface Session {
  signedIn: boolean;
  email?: string | null;
  name?: string | null;
  role?: string;
}

export function AccountMenu() {
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const signedIn = document.cookie.split(";").some((part) => (part.trim().split("=")[0] ?? "").includes("auth-token"));
    if (!signedIn) {
      setSession({ signedIn: false });
      return;
    }
    const controller = new AbortController();
    fetch("/api/session", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { signedIn: false }))
      .then((body: Session) => setSession(body))
      .catch(() => setSession({ signedIn: false }));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) {
    return <span className="inline-block h-9 w-9 rounded-full bg-slate-100" aria-hidden />;
  }

  if (!session.signedIn) {
    return <Link href="/login" className="btn-primary px-3 py-1.5">Sign in</Link>;
  }

  const label = session.name || session.email || "Account";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="truncate px-2 py-1.5 text-xs text-slate-500">{label}</p>
          <Link href="/candidate/dashboard" role="menuitem" className="block rounded-lg px-2 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpen(false)}>
            Your account
          </Link>
          {session.role === "admin" && (
            <Link href="/admin/dashboard" role="menuitem" className="block rounded-lg px-2 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button type="submit" role="menuitem" className="w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
