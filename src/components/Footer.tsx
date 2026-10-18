import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page space-y-3 py-8 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">AMU Pulse is independent and nonpartisan.</p>
        <p>
          It is not affiliated with, endorsed by, or operated by Aligarh Muslim University or the AMU Students&apos; Union.
          We do not run voting, collect voting intentions, or rank candidates. Always confirm dates and rules with the
          official AMU Registrar notices.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Link href="/election-guide" className="hover:underline">Election guide</Link>
          <Link href="/poster" className="hover:underline">QR poster</Link>
          <Link href="/candidate/dashboard" className="hover:underline">For candidates</Link>
        </div>
      </div>
    </footer>
  );
}
