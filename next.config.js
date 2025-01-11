const path = require('path');
const { getPaths } = require('./src/config/docusaurus.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DOCUSAURUS_ROOT_PATH: process.env.DOCUSAURUS_ROOT_PATH
  },
  async rewrites() {
    return [
      {
        source: '/img/:path*',
        destination: `http://${process.env.NEXT_PUBLIC_DOCUSAURUS_URL}/img/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
