import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Files read from disk at runtime must be bundled with the server functions on Vercel.
  outputFileTracingIncludes: {
    '/api/cities': ['./.generated/cities.json'],
    '/api/card/[kind]': ['./node_modules/@fontsource/*/files/*-latin-*-normal.woff'],
  },
};

export default nextConfig;
