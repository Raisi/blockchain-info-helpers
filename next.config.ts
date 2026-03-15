import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/blockchain-info-helpers" : "",
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
