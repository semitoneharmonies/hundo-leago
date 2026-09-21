import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [
    {
      name: "release-qa-helper-eslint-banner",
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type === "chunk") {
            output.code = `/* eslint-disable */\n${output.code}`;
          }
        }
      },
    },
  ],
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(here, "strict-manager-transfer.source.js"),
      fileName: () => "strict-manager-transfer.js",
      formats: ["iife"],
      name: "HundoReleaseQaStrictManagerTransfer",
    },
    minify: false,
    outDir: here,
    sourcemap: false,
    target: "es2020",
  },
});
