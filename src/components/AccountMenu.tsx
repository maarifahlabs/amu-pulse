import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function AccountMenu() {
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

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

  if (loading) {
    return <span className="inline-block h-9 w-9 rounded-full bg-slate-100 animate-pulse" aria-hidden />;
  }

  if (!user) {
    return (
      <Link to="/login" className="btn-primary px-3 py-1.5">
        Sign in
      </Link>
    );
  }

  const label = profile?.display_name || user.email || "Account";

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition"
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
          <p className="truncate px-2 py-1.5 text-xs text-slate-500 font-medium">{label}</p>
          <div className="h-px bg-slate-100 my-1" />
          <Link
            to="/candidate/dashboard"
            role="menuitem"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Your account
          </Link>
          {profile?.role === "admin" && (
            <Link
              to="/admin/dashboard"
              role="menuitem"
              className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full text-left rounded-lg px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
