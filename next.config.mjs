/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint locally with `npm run lint`; don't let lint warnings block deploys.
  eslint: { ignoreDuringBuilds: true },
  // Send proper headers for the service worker and manifest.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
    ];
  },
};

export default nextConfig;
