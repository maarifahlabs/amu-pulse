"use client";

import Link from "next/link";
import { VOTING_CLOSED_MESSAGE, votingOpen } from "@/lib/voting";

export function VoteLink({ className }: { className: string }) {
  if (!votingOpen()) {
    return (
      <button type="button" className={className} onClick={() => window.alert(VOTING_CLOSED_MESSAGE)}>
        Vote
      </button>
    );
  }
  return (
    <Link href="/vote" className={className}>
      Vote
    </Link>
  );
}
