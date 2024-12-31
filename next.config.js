const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

try {
  if (!fs.existsSync('public/img')) {
    fs.symlinkSync(
      path.resolve(process.cwd(), '../static/img'),
      'public/img',
      'junction'
    );
  }
} catch (error) {
  console.error('Symlink error:', error);
}

module.exports = nextConfig
