import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google user avatars
      'supabase.co', // Supabase storage
      'drive.google.com', // Google Drive videos
    ],
  },
  // Support for Hebrew/RTL
  i18n: {
    locales: ['en', 'he'],
    defaultLocale: 'he',
    localeDetection: false
  }
};

export default nextConfig;
