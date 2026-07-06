import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  packages: "external",
  alias: {
    "@": "./app",
  },
  logLevel: "info",
});
