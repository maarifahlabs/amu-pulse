import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { getDataset, issueResponseCount } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 300;

/** Neutral 1200x630 share card for WhatsApp, social previews and downloads. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ds = await getDataset();
  const issue = ds.issues.find((i) => i.slug === slug);
  if (!issue) return new Response("Not found", { status: 404 });

  const responded = issueResponseCount(ds, issue.id);
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const qr = await QRCode.toDataURL(`${SITE_URL}/issues/${issue.slug}`, { margin: 1, width: 180 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0a6a52 0%, #073b2f 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
          <div style={{ display: "flex", fontWeight: 700 }}>AMU Pulse · Campus Issue</div>
          <div style={{ display: "flex", padding: "6px 18px", borderRadius: 999, background: "rgba(255,255,255,0.15)" }}>
            {issue.category}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", flex: 1, fontSize: issue.title.length > 70 ? 50 : 60, fontWeight: 700, lineHeight: 1.15 }}>
            {issue.title}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={180} height={180} alt="" style={{ borderRadius: 12 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 30 }}>
            {responded} of {ds.candidates.length} candidates responded · Read every answer
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, opacity: 0.8 }}>
            <div style={{ display: "flex" }}>{`${host}/issues/${issue.slug}`}</div>
            <div style={{ display: "flex" }}>Independent · Nonpartisan · Not affiliated with AMU</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Content-Disposition": `inline; filename="amu-pulse-${issue.slug}.png"` },
    },
  );
}
