import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this app so an unrelated lockfile higher up
  // the tree doesn't get picked as the workspace root.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
