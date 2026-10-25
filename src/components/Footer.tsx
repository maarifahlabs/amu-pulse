import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-page space-y-3 py-8 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">AMU Pulse is independent and nonpartisan.</p>
        <p>
          It is not affiliated with, endorsed by, or operated by Aligarh Muslim University or the AMU Students&apos; Union.
          A choice saved here is not the official ballot, and candidates are not ranked. Always confirm dates and rules with the
          official AMU Registrar notices.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/contact" className="hover:underline">Contact us</Link>
          <Link to="/election-guide" className="hover:underline">Election guide</Link>
          <Link to="/poster" className="hover:underline">QR poster</Link>
          <Link to="/candidate/dashboard" className="hover:underline">For candidates</Link>
          <a href="https://www.maarifahlabs.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Maarifah Labs</a>
        </div>
      </div>
    </footer>
  );
}
