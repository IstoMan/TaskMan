import type { NextConfig } from "next";

/** Go API base URL (no trailing slash). Used to proxy /api/* in dev & prod. */
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:9090";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/signup", destination: "/signup", permanent: true },
    ];
  },
};

export default nextConfig;
