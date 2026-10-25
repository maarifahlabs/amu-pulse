import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function PosterPage() {
  const [svg, setSvg] = useState<string>("");
  const homeUrl = window.location.origin;
  const host = homeUrl.replace(/^https?:\/\//, "");

  useEffect(() => {
    QRCode.toString(homeUrl, { type: "svg", margin: 1, width: 256 })
      .then((data) => setSvg(data))
      .catch((err) => console.error(err));
  }, [homeUrl]);

  return (
    <div className="container-page flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex gap-3 print:hidden">
        <button onClick={() => window.print()} className="btn-primary">
          Print Poster
        </button>
      </div>
      <p className="text-sm text-slate-500 print:hidden">
        Print this page for permitted noticeboards only, subject to university election rules.
      </p>
      <div className="card flex max-w-md flex-col items-center gap-4 p-8 border-2 border-slate-300 shadow-lg">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white font-bold text-2xl font-display shadow-sm">
          P
        </div>
        <h1 className="text-3xl font-bold font-display text-brand-900">AMU Pulse</h1>
        <p className="text-lg font-semibold text-slate-800">Your Campus. Your Questions. Your Choice.</p>
        <div className="w-64 p-2 bg-white rounded-xl shadow-inner border border-slate-200" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="font-mono font-bold text-brand-700 text-base">{host}</p>
        <p className="text-sm text-slate-600">
          Scan to explore campus issues and compare every candidate&apos;s verified answers side-by-side.
        </p>
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          Independent and nonpartisan · Not affiliated with AMU
        </p>
      </div>
    </div>
  );
}
