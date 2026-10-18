import type { Metadata } from "next";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "QR poster",
  robots: { index: false },
};

export default async function PosterPage() {
  const svg = await QRCode.toString(SITE_URL, { type: "svg", margin: 1, width: 256 });
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <div className="container-page flex flex-col items-center gap-6 py-10 text-center">
      <p className="text-sm text-slate-500 print:hidden">
        Print this page for permitted noticeboards only, subject to university rules.
      </p>
      <div className="card flex max-w-md flex-col items-center gap-4 p-8">
        <h1 className="text-3xl font-bold text-brand-900">AMU Pulse</h1>
        <p className="text-lg font-medium">Your Campus. Your Questions. Your Choice.</p>
        <div className="w-64" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="font-semibold">{host}</p>
        <p className="text-sm text-slate-600">
          Explore campus issues and compare every candidate&apos;s published answers.
        </p>
        <p className="text-xs text-slate-500">Independent and nonpartisan. Not affiliated with AMU.</p>
      </div>
    </div>
  );
}
