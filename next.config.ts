import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const legacyOrigin = (process.env.LEGACY_SITE_ORIGIN ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async rewrites() {
    if (!legacyOrigin) return [];
    return {
      fallback: [
        { source: "/", destination: `${legacyOrigin}/`, basePath: false },
        { source: "/:path*", destination: `${legacyOrigin}/:path*`, basePath: false },
      ],
    };
  },
  async redirects() {
    const hasHyphenHost = [{ type: "host" as const, value: "amu-pulse.maarifahlabs.com" }];
    return [
      { source: "/", has: hasHyphenHost, destination: "https://amupulse.maarifahlabs.com", permanent: true },
      { source: "/:path*", has: hasHyphenHost, destination: "https://amupulse.maarifahlabs.com/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
