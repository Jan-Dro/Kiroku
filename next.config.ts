import type { NextConfig } from "next";

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
const serverActionBodySizeLimitMb =
  Number.isFinite(maxUploadSizeMb) && maxUploadSizeMb > 0 ? Math.floor(maxUploadSizeMb) : 10;

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: `${serverActionBodySizeLimitMb}mb`,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
