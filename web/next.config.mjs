/** @type {import('next').NextConfig} */
const nextConfig = {
  // The backend now lives in its own service (see backend/) — this proxies
  // every /api/* request straight through to it. The browser still only
  // ever talks to this app's own origin, so the listen_session cookie stays
  // first-party and every existing relative fetch("/api/...") call in
  // lib/store.js, app/page.js, components/AudioEngine.js, and
  // app/(app)/upload/page.js keeps working unchanged — no CORS, no
  // SameSite=None, no credentials: "include" needed anywhere.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
