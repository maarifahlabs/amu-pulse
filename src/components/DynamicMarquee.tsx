import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useDataset } from "@/hooks/useDataset";
import { formatDate } from "@/lib/format";

export interface MarqueeItem {
  id: string;
  badge: string;
  badgeColor?: "red" | "green" | "gold" | "blue" | string;
  text: string;
  link?: string;
}

interface DynamicMarqueeProps {
  customStatements?: MarqueeItem[];
}

export function DynamicMarquee({ customStatements }: DynamicMarqueeProps) {
  const { dataset: ds, voteCounts } = useDataset();
  const [dbItems, setDbItems] = useState<any[]>([]);

  // Fetch live marquee updates from backend
  useEffect(() => {
    let isMounted = true;
    const fetchMarquee = async () => {
      try {
        const data = await api.get<any[]>("/marquee");
        if (isMounted && Array.isArray(data)) {
          setDbItems(data);
        }
      } catch {
        // Fall back gracefully to dataset highlights
      }
    };

    fetchMarquee();
    // Poll every 45s for newly added statements
    const interval = setInterval(fetchMarquee, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Compute live statistics dynamically for fallback
  const totalVotes = Object.values(voteCounts ?? {}).reduce((sum, count) => sum + count, 0);
  const candidatesCount = ds?.candidates?.length ?? 0;
  const positionsCount = ds?.positions?.length ?? 0;
  const issuesCount = ds?.issues?.length ?? 0;

  // Upcoming election milestones dynamically
  const upcomingEvents = (ds?.events ?? [])
    .filter((e) => Boolean(e.starts_at))
    .slice(0, 3);

  // Default dynamic statements list if custom ones are not in DB
  const defaultStatements: MarqueeItem[] = [
    {
      id: "vote-action",
      badge: "VOTE LIVE",
      badgeColor: "red",
      text: "AMUSU Elections 2026: Online student balloting is open! Cast your vote for President, VP, Secretary & Cabinet Members.",
      link: "/vote",
    },
    ...(totalVotes > 0
      ? [
          {
            id: "total-votes",
            badge: "LIVE PULSE",
            badgeColor: "gold",
            text: `Over ${totalVotes.toLocaleString()} student votes recorded anonymously on AMU Pulse.`,
            link: "/candidates",
          },
        ]
      : []),
    ...upcomingEvents.map((event, idx) => ({
      id: `event-${event.id || idx}`,
      badge: event.kind === "polling" ? "POLLING DAY" : "SCHEDULE",
      badgeColor: (event.kind === "polling" ? "red" : "green") as "red" | "green",
      text: `${event.title}${event.starts_at ? ` · ${formatDate(event.starts_at)}` : ""}${event.time_label ? ` (${event.time_label})` : ""}`,
      link: "/election-guide",
    })),
    {
      id: "candidates-overview",
      badge: "CANDIDATES",
      badgeColor: "green",
      text: `${candidatesCount} verified candidates contesting across ${positionsCount} Students' Union posts. Compare their manifestos and stances.`,
      link: "/candidates",
    },
    {
      id: "issues-overview",
      badge: "CAMPUS ISSUES",
      badgeColor: "blue",
      text: `${issuesCount} critical student issues under review: 24/7 library reading rooms, hostel amenities, dining quality & scholarships.`,
      link: "/issues",
    },
    {
      id: "dua-appeal",
      badge: "VOTE & DUA",
      badgeColor: "gold",
      text: "Vote, Support & Dua (ووٹ، سپورٹ اور دعا) — Every student ballot shapes the future of Aligarh Muslim University.",
      link: "/vote",
    },
  ];

  // If customStatements passed as prop, use those.
  // Otherwise if admin added statements in database, use those!
  // Else fallback to default dynamic election statements.
  const dynamicStatements: MarqueeItem[] =
    customStatements && customStatements.length > 0
      ? customStatements
      : dbItems.length > 0
      ? dbItems.map((item, idx) => ({
          id: item.id || `db-${idx}`,
          badge: "UPDATE",
          badgeColor: "red" as const,
          text: item.text,
          link: item.link || undefined,
        }))
      : defaultStatements;

  const renderBadge = (item: MarqueeItem) => {
    switch (item.badgeColor) {
      case "gold":
        return "bg-amber-500/25 text-amber-200 border-amber-400/50";
      case "blue":
        return "bg-sky-500/25 text-sky-200 border-sky-400/50";
      case "green":
        return "bg-emerald-500/25 text-emerald-200 border-emerald-400/50";
      case "red":
      default:
        return "bg-red-600/40 text-red-100 border-red-400/60 shadow-xs";
    }
  };

  const renderContent = () => (
    <>
      {dynamicStatements.map((item, idx) => (
        <span key={`${item.id}-${idx}`} className="inline-flex items-center gap-3 px-6 text-xs sm:text-sm">
          {/* Badge */}
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] sm:text-xs font-black tracking-wide uppercase ${renderBadge(
              item,
            )}`}
          >
            {item.badge}
          </span>

          {/* Statement text (clickable if link exists) */}
          {item.link ? (
            <Link
              to={item.link}
              className="text-white font-medium hover:text-red-200 hover:underline transition-colors cursor-pointer"
            >
              {item.text}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.text}</span>
          )}

          {/* Red visual separator */}
          <span className="text-red-400 font-bold ml-2 select-none opacity-80">✦</span>
        </span>
      ))}
    </>
  );

  return (
    <div className="relative border-b border-red-800/80 bg-[#7f1d1d] text-white shadow-sm">
      <div className="flex items-center">
        {/* Fixed Header Pill on the Left in Bold Red */}
        <div className="z-10 flex shrink-0 items-center gap-2 bg-[#550b0b] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-red-100 shadow-md border-r border-red-800/80">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="hidden sm:inline">LIVE UPDATES</span>
          <span className="sm:hidden">UPDATES</span>
        </div>

        {/* Seamless Infinite Marquee Track (Multiple statements in single line at slower speed) */}
        <div className="dynamic-marquee flex-1 py-1.5 overflow-hidden" title="Hover to pause ticker">
          <div className="dynamic-marquee-track">
            {renderContent()}
          </div>
          <div className="dynamic-marquee-track" aria-hidden="true">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
