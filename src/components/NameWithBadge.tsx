import { useDataset } from "@/hooks/useDataset";

export function VerifiedBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className="h-[1.15em] w-[1.15em] shrink-0" role="img" aria-label="Verified">
      <path fill="#43A047" d="M 450,250 C 450,270 435,283 430,301 C 425,319 434,338 424,354 C 414,370 396,375 383,388 C 370,401 365,419 349,429 C 333,439 314,430 296,435 C 278,440 265,455 245,455 C 225,455 212,440 194,435 C 176,430 157,439 141,429 C 125,419 120,401 107,388 C 94,375 76,370 66,354 C 56,338 65,319 60,301 C 55,283 40,270 40,250 C 40,230 55,217 60,199 C 65,181 56,162 66,146 C 76,130 94,125 107,112 C 120,99 125,81 141,71 C 157,61 176,70 194,65 C 212,60 225,45 245,45 C 265,45 278,60 296,65 C 314,70 333,61 349,71 C 365,81 370,99 383,112 C 396,125 414,130 424,146 C 434,162 425,181 430,199 C 435,217 450,230 450,250 Z" />
      <circle cx="250" cy="250" r="140" fill="#E8F8ED" />
      <path fill="#43A047" d="M 226,326 L 162,262 C 154,254 154,242 162,234 C 170,226 182,226 190,234 L 236,280 L 316,180 C 324,170 336,168 346,176 C 356,184 358,196 350,206 L 248,326 C 242,333 232,333 226,326 Z" />
    </svg>
  );
}

/** Claimed profiles with more than 99 votes show the badge to the right of the name. */
export function NameWithBadge({
  id,
  name,
  claimed,
  initialVotes = 0,
  className = "",
  truncate = false,
}: {
  id: string;
  name: string;
  claimed: boolean;
  initialVotes?: number;
  className?: string;
  truncate?: boolean;
}) {
  const { voteCounts } = useDataset();
  const votes = voteCounts[id] ?? initialVotes;
  const verified = claimed && votes > 99;

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 align-middle ${className}`}>
      <span className={truncate ? "min-w-0 truncate" : undefined}>{name}</span>
      {verified && <VerifiedBadge />}
    </span>
  );
}
