/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@botme/ui", "@botme/shared"],
};

module.exports = nextConfig;
