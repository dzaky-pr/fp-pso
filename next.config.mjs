/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Skip build-time static generation for dynamic pages
  trailingSlash: false,
  // Allow builds to continue even when external API calls fail
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Ensure environment variables are available during build
  env: {
    AWS_API_URL: process.env.AWS_API_URL,
  },
  // Disabled image optimization with sharp
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
