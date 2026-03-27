import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Serverless-compatible — no long-running processes, no background workers
  // Vercel free tier: all routes are serverless functions
};

export default nextConfig;
