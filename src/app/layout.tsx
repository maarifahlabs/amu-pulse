import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NavProgress } from "@/components/NavProgress";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { absoluteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(`${absoluteUrl("/")}/`),
  title: {
    default: "AMU Pulse — Your Campus. Your Questions. Your Choice.",
    template: "%s · AMU Pulse",
  },
  description:
    "An independent, nonpartisan space for AMU students to explore campus issues, question candidates and compare their published responses.",
  openGraph: { type: "website", siteName: "AMU Pulse" },
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
        <NavProgress />
        <SampleDataBanner />
        <Header />
        <main id="main" className="flex-1 pb-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
