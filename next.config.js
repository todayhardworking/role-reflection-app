/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/weekly/current",
        destination: "/weekly/summary",
        permanent: true,
      },
    ];
  },
};

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};


export default nextConfig;
