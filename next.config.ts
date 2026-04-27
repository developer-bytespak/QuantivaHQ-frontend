import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/:path*",
        destination: "/vc-pool/admin/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/vc-pool/admin/:path*",
        destination: "/admin/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // KYC verification embeds the Sumsub iframe which calls
            // getUserMedia() to capture the selfie. With camera=() the iframe
            // gets stuck on "Connecting your camera…" because the policy
            // blocks access before the browser permission prompt even fires.
            // The browser still asks the user for camera/mic consent on first
            // use, so this is not a security regression — it just opts in to
            // allowing the prompt to appear.
            key: "Permissions-Policy",
            value: "camera=*, microphone=*, geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
