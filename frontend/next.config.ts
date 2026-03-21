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
      { source: "/login", destination: "/auth/login", permanent: false },
      { source: "/signup", destination: "/auth/signup", permanent: false },
    ];
  },
};

export default nextConfig;
