import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-slate-600">This page may have been moved or isn&apos;t published yet.</p>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
