/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse (via pdfjs-dist) dynamically imports a worker script at
  // runtime in a way the bundler can't statically resolve — run it as a
  // real Node dependency instead of bundling it.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
