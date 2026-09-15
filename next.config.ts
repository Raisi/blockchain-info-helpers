import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  // Emit <slug>/index.html so GitHub Pages serves both /slug and /slug/
  trailingSlash: true,
  basePath: isProd ? "/blockchain-info-helpers" : "",
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
