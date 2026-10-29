/**
 * AMU Students' Union Positions:
 * Chair is President, Vice President & Secretary.
 * Others include Cabinet Members, University Court representatives, etc.
 */
export function isChairPosition(position?: { title?: string | null; slug?: string | null } | string | null): boolean {
  if (!position) return false;
  const str = typeof position === "string" ? position : `${position.slug ?? ""} ${position.title ?? ""}`;
  const lower = str.toLowerCase();
  return (
    lower.includes("president") ||
    lower.includes("secretary")
  );
}

/**
 * Pricing for Email Campaigning:
 * ₹200 per 1000 students for Chair
 * ₹100 per 1000 students for Others
 */
export function calculateCampaignPrice(recipientCount: number, isChair: boolean) {
  const count = Math.max(1, recipientCount);
  const units = Math.ceil(count / 1000);
  const ratePerThousand = isChair ? 200 : 100;
  return {
    units,
    ratePerThousand,
    totalAmount: units * ratePerThousand,
  };
}

/**
 * Pricing for Last Day Reminder (goes to candidate's voters only):
 * 1 - 1000 votes: ₹200 for chair, ₹100 for others
 * 1001 - 2000 votes: ₹400 for chair, ₹200 for others
 * 2001 - 3000 votes: ₹600 for chair, ₹300 for others
 * and so on.
 */
export function calculateReminderPrice(voterCount: number, isChair: boolean) {
  if (voterCount <= 0) {
    return {
      units: 0,
      ratePerThousand: isChair ? 200 : 100,
      totalAmount: 0,
      eligible: false,
    };
  }
  const units = Math.ceil(voterCount / 1000);
  const ratePerThousand = isChair ? 200 : 100;
  return {
    units,
    ratePerThousand,
    totalAmount: units * ratePerThousand,
    eligible: true,
  };
}

export interface CandidateDisplayInfo {
  name: string;
  postTitle?: string | null;
  ballotNumber?: number | null;
  faculty?: string | null;
  department?: string | null;
}

/**
 * Predefined template of "Vote, Support & Dua" with manifesto sharing.
 */
export function buildCampaignPredefinedTemplate(
  candidate: CandidateDisplayInfo,
  manifestoContent?: string | null,
  customAppeal?: string,
) {
  const serialText = candidate.ballotNumber ? ` (Ballot No. ${candidate.ballotNumber})` : "";
  const post = candidate.postTitle ? `for ${candidate.postTitle}` : "in AMUSU Elections 2026";

  const appeal = customAppeal?.trim() || [
    "Dear AMU Student,",
    "",
    `I am reaching out to humbly request your valuable Vote, Support & Dua as I contest ${post}${serialText}.`,
    "AMU has always championed student welfare, dignity, and collective progress. Together, we can ensure transparent representation, modern campus facilities, and an empowered student community.",
  ].join("\n");

  const manifestoText = manifestoContent?.trim()
    ? `\n\n📌 KEY MANIFESTO COMMITMENTS:\n${manifestoContent.trim()}`
    : "\n\n📌 KEY MANIFESTO COMMITMENTS:\n• Advocate for 24/7 library reading room access and enhanced academic infrastructure.\n• Ensure prompt redressal of student grievances, scholarship disbursements, and hostel amenities.\n• Promote a fearless, democratic, and inclusive campus environment for all.";

  const closing = [
    "",
    "🤲 VOTE, SUPPORT & DUA (ووٹ، سپورٹ اور دعا)",
    `Please cast your precious vote for ${candidate.name}${serialText} on polling day.`,
    "Your trust is my sacred duty. Kindly remember me in your prayers.",
    "",
    "In warm regards,",
    candidate.name,
    candidate.postTitle ? `Candidate for ${candidate.postTitle}` : "Candidate",
    candidate.faculty || candidate.department ? `${candidate.department || ""} ${candidate.faculty ? `(${candidate.faculty})` : ""}`.trim() : "",
    "AMU Students' Union Election 2026",
  ].join("\n");

  return {
    subject: `Appeal for Vote, Support & Dua — ${candidate.name}${candidate.postTitle ? ` (${candidate.postTitle})` : ""}`,
    appeal,
    manifestoSection: manifestoText,
    fullContent: `${appeal}${manifestoText}${closing}`,
    predefinedBadge: "Vote, Support & Dua",
  };
}

/**
 * Predefined template for Last Day Reminder (to candidate's voters).
 */
export function buildReminderPredefinedTemplate(
  candidate: CandidateDisplayInfo,
  customNote?: string,
) {
  const serialText = candidate.ballotNumber ? ` (Ballot Serial #${candidate.ballotNumber})` : "";
  const post = candidate.postTitle ? `for ${candidate.postTitle}` : "";

  const note = customNote?.trim() ? `\n\n${customNote.trim()}\n` : "";

  const content = [
    "⏰ URGENT: FINAL POLLING DAY REMINDER — AMUSU ELECTIONS 2026",
    "----------------------------------------------------------",
    "Dear Supporter & Voter,",
    "",
    `Today is the decisive polling day! Thank you for standing firmly with ${candidate.name} ${post}${serialText} on AMU Pulse.`,
    note,
    "Your single vote will shape the leadership of AMU Students' Union for the coming year. Please head to your designated hall/department polling booth with your valid student identity card and cast your ballot early.",
    "",
    "🤲 VOTE, SUPPORT & DUA (ووٹ، سپورٹ اور دعا)",
    `Support ${candidate.name}${serialText} and keep our campaign in your prayers today.`,
    "",
    "With heartfelt gratitude,",
    candidate.name,
    candidate.postTitle ? `Candidate for ${candidate.postTitle}` : "Candidate",
    "AMU Students' Union Election 2026",
  ].join("\n");

  return {
    subject: `⏰ Polling Day Reminder: Cast your Vote for ${candidate.name}${candidate.postTitle ? ` (${candidate.postTitle})` : ""}`,
    content,
    predefinedBadge: "Last Day Voter Reminder",
  };
}
