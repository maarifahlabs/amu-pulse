import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { VoteCountsProvider } from "@/components/VoteCounts";
import { QueryMessage } from "@/components/QueryMessage";
import { Header } from "@/components/Header";
import { NavProgress } from "@/components/NavProgress";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { absoluteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`${absoluteUrl("/")}/`),
  title: {
    default: "AMU Pulse — AMUSU election 2026",
    template: "%s · AMU Pulse",
  },
  description:
    "AMU Pulse is an independent guide to the AMU Students' Union (AMUSU) election 2026. Compare candidates, read their answers, and check the published dates.",
  applicationName: "AMU Pulse",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "AMU Pulse",
    locale: "en_IN",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b8565",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <SampleDataBanner />
        <Header />
        <Suspense>
          <QueryMessage />
        </Suspense>
        <VoteCountsProvider>
          <main id="main" className="flex-1 pb-16">
            {children}
          </main>
        </VoteCountsProvider>
        <Footer />
      </body>
    </html>
  );
}
