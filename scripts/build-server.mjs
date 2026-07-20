import esbuild from "esbuild";

const shared = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  packages: "external",
  alias: {
    "@": "./app",
  },
  logLevel: "info",
};

await esbuild.build({
  ...shared,
  entryPoints: ["server.ts"],
  outfile: "dist/server.js",
});

await esbuild.build({
  ...shared,
  entryPoints: ["workers/image-optimize-worker.ts"],
  outfile: "dist/image-optimize-worker.js",
});
