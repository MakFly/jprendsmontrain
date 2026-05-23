import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@max-sncf/shared"],
  // Produce a self-contained server bundle for Docker (.next/standalone).
  output: "standalone",
  // Trace files from the monorepo root so the workspace package
  // (@max-sncf/shared) is included in the standalone output.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
