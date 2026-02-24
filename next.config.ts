import type { NextConfig } from "next";
import path from "path";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision: "offline-v1" }],
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const projectRoot = path.resolve(__dirname);
const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  webpack: (config, { dev, isServer }) => {
    config.context = projectRoot;
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "10.20.11.143",
        port: "8000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "10.20.10.12",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
