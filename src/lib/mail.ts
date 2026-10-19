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

function senderAddress(value: string) {
  const wrapped = value.match(/^(.*)<([^>]+)>\s*$/);
  if (wrapped) {
    const email = wrapped[2].trim();
    const name = wrapped[1].trim().replace(/^"|"$/g, "") || "AMU Pulse";
    return email.includes("@") ? { name, email } : null;
  }
  const email = value.trim();
  return email.includes("@") ? { name: "AMU Pulse", email } : null;
}

/** Emails claim details through Brevo. Skips quietly when mail is not configured. */
export async function sendClaimNotice(notice: ClaimNotice): Promise<boolean> {
  const to = process.env.CLAIM_NOTIFY_EMAIL?.trim();
  const key = process.env.BREVO_API_KEY?.trim();
  const sender = senderAddress(process.env.CLAIM_NOTIFY_FROM?.trim() || "");
  if (!to || !key || !sender) return false;

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

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject: `Profile claim: ${notice.candidateName}`,
      textContent: text,
    }),
  });

  if (!response.ok) {
    console.error("claim email failed", response.status);
    return false;
  }
  return true;
}
