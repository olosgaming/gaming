import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://olosgaming.onrender.com/api/:path*',
      },
    ]
  },
};

export default nextConfig;
