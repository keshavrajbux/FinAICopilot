/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports for Vercel Edge Runtime
  output: 'standalone',
  // Environment variables accessible on the client-side
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Ensure consistent path handling
  trailingSlash: false,
  // Explicitly specify page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig; 