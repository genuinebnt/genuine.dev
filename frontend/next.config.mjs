/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Uploaded images are stored as site-relative `/uploads/*` paths (portable
  // across environments). Proxy them to the backend so they resolve in dev;
  // in prod Caddy fronts `/uploads` directly.
  async rewrites() {
    const api = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";
    return [{ source: "/uploads/:path*", destination: `${api}/uploads/:path*` }];
  },
};
export default nextConfig;
