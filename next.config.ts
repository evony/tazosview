import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  compress: true,
  allowedDevOrigins: ['.space-z.ai', 'localhost'],
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'framer-motion',
      '@tanstack/react-table',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
         source: '/logo1.webp',
         headers: [
           { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
         ],
      },
      {
         source: '/bg-default.jpg',
         headers: [
           { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
         ],
      },
    ];
  },
};

export default nextConfig;
