const path = require('path');
const { getPaths } = require('./src/config/docusaurus.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/img/:path*',
        destination: `${process.env.DOCUSAURUS_URL}/img/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
