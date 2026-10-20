"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function clickedElement(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
}

export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = clickedElement(event.target)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.target === "_blank" || form.dataset.voteGate === "closed") return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-100">
        <div className="nav-progress h-full bg-brand-600" />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-white/50">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 bg-white shadow-sm" />
      </div>
    </div>
  );
}
