/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode double-invokes effects in dev, which races two concurrent
  // getUserMedia/Html5Qrcode.start() calls against the same camera stream.
  reactStrictMode: false,
};

module.exports = nextConfig;
