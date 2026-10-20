/** Personal ballot opens once the 27 October final voter list is out (4 pm IST). */
export const VOTING_OPENS_AT = "2026-10-27T16:00:00+05:30";

export const CABINET_SLUG = "cabinet-member";
export const CABINET_LIMIT = 10;

export const VOTING_CLOSED_MESSAGE =
  "Voting opens after the final list on 27 October 2026 at 4 pm.";

export function votingOpen(now = Date.now()) {
  return now >= new Date(VOTING_OPENS_AT).getTime();
}

export function voteLimit(positionSlug: string) {
  return positionSlug === CABINET_SLUG ? CABINET_LIMIT : 1;
}
