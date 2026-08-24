import type { NextConfig } from "next";

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
const serverActionBodySizeLimitMb =
  Number.isFinite(maxUploadSizeMb) && maxUploadSizeMb > 0 ? maxUploadSizeMb : 10;
const serverActionBodySizeLimitBytes = Math.round(serverActionBodySizeLimitMb * 1024 * 1024);

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: `${serverActionBodySizeLimitBytes}`,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
