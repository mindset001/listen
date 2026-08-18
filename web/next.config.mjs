/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse (via pdfjs-dist) dynamically imports a worker script at
  // runtime in a way the bundler can't statically resolve — run it as a
  // real Node dependency instead of bundling it.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // serverExternalPackages keeps the bundler from mangling pdfjs-dist's own
  // require.resolve calls, but it's a separate concern from Vercel's file
  // trace (@vercel/nft) that decides which files actually ship with the
  // deployed function. app/api/upload/route.js loads the worker via a
  // runtime-built path (see its own comment for why), which has no static
  // import for the tracer to follow, so pdf.worker.mjs was silently missing
  // from production and every /api/upload request 500'd — including plain
  // .txt uploads, since the crash happens at module load, before the
  // request handler's own file-type branching ever runs.
  outputFileTracingIncludes: {
    "/api/upload": ["./node_modules/pdfjs-dist/legacy/build/**/*"],
  },
};

export default nextConfig;
