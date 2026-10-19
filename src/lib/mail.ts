import "server-only";
import { absoluteUrl } from "@/lib/env";

export interface ClaimNotice {
  candidateName: string;
  post: string;
  serial: string;
  slug: string;
  accountEmail: string;
  contactEmail: string;
  phone: string;
  proof: string;
}

/** Emails claim details to the review inbox. Skips quietly when mail is not configured. */
export async function sendClaimNotice(notice: ClaimNotice): Promise<boolean> {
  const to = process.env.CLAIM_NOTIFY_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (!to || !key) return false;

  const from = process.env.CLAIM_NOTIFY_FROM || "AMU Pulse <onboarding@resend.dev>";
  const profileUrl = absoluteUrl(`/candidates/${notice.slug}`);
  const reviewUrl = absoluteUrl("/admin/dashboard");
  const text = [
    "A candidate submitted a profile claim. Editing stays locked until this is approved.",
    "",
    `Name: ${notice.candidateName}`,
    `Post: ${notice.post || "—"}`,
    `Serial: ${notice.serial || "—"}`,
    `Profile: ${profileUrl}`,
    `Account email: ${notice.accountEmail}`,
    `Contact email: ${notice.contactEmail}`,
    `Phone: ${notice.phone}`,
    "",
    "Proof of candidacy:",
    notice.proof,
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Profile claim: ${notice.candidateName}`,
      text,
    }),
  });

  if (!response.ok) {
    console.error("claim email failed", response.status);
    return false;
  }
  return true;
}
