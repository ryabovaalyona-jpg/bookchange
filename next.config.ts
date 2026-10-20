import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Отдельная папка сборки для автотестов: они идут параллельно с `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: {
      // До трёх фото по 10 МБ (PRD, раздел 11). Телефон сжимает их заранее.
      bodySizeLimit: "32mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
