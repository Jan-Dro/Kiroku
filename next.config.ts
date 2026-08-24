import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions config moved to top-level in newer Next.js versions so
  // the bodySizeLimit is honored for large multipart/form-data uploads.
  serverActions: {
    bodySizeLimit: "50mb",
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
