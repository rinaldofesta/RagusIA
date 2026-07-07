import type { NextConfig } from "next";

// Content-Security-Policy reflecting the app's real resource origins:
//   - Phosphor icon stylesheets/fonts load from unpkg.com (app/layout.tsx)
//   - Leaflet map tiles load from Esri (arcgisonline) and CARTO (app map)
// Shipped as Report-Only first (roadmap M1): it never blocks, so the map can't
// break while script/style are still tightened toward a nonce-based enforcing
// policy. 'unsafe-inline' is present because Next injects inline hydration
// scripts and the design uses inline styles — both to be replaced before enforce.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: https://server.arcgisonline.com https://*.basemaps.cartocdn.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "font-src 'self' https://unpkg.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
