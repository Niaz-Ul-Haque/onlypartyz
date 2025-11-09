import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yguecklprymwxuvrkhor.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/party-images/**',
      },
    ],
  },
};

export default nextConfig;
