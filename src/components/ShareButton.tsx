"use client";

import { useState } from "react";

export function ShareButton({ url, title, text, cardUrl }: { url: string; title: string; text: string; cardUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed; fall through to copying the link.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className="btn-primary">Share</button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secondary">WhatsApp</a>
      <button type="button" onClick={copy} className="btn-secondary" aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </button>
      {cardUrl && (
        <a href={cardUrl} download className="btn-secondary">Download card</a>
      )}
    </div>
  );
}
