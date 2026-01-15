/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Production optimizations
  compress: true,

  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },

  // Optimize images (for future use)
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production build optimizations
  productionBrowserSourceMaps: false,

  // Optimize output
  output: 'standalone',
};

module.exports = nextConfig;
