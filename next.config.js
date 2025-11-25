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

export default nextConfig;
