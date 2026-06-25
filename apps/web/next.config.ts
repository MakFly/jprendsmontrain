import type { NextConfig } from "next";
import path from "node:path";

// A per-build version string. Each `next build` (i.e. each Docker image /
// deploy) gets a fresh value, which is appended to the service-worker
// registration URL (`/sw.js?v=…`). A changed URL makes the browser detect a
// new SW → the app shows a "new version available" prompt. Override in CI by
// setting NEXT_PUBLIC_SW_VERSION (e.g. to the git SHA) for a stable marker.
const swVersion = process.env.NEXT_PUBLIC_SW_VERSION || String(Date.now());

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@max-sncf/shared"],
  env: { NEXT_PUBLIC_SW_VERSION: swVersion },
  // Produce a self-contained server bundle for Docker (.next/standalone).
  output: "standalone",
  // Trace files from the monorepo root so the workspace package
  // (@max-sncf/shared) is included in the standalone output.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
