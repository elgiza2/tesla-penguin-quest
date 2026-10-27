// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    optimizeDeps: { include: ["buffer"] },
    plugins: [
      {
        // Bundle the real `buffer` package in the client build; otherwise Vite
        // swaps it for an empty browser-external stub and @ton/core crashes.
        name: "buffer-polyfill-resolve",
        enforce: "pre",
        resolveId(source: string, _importer: string | undefined, options: { ssr?: boolean | undefined }) {
          // Client bundle only — the server (workerd) has a native buffer builtin.
          if (options?.ssr || this.environment?.mode === "dev") return null;
          if (source === "buffer" || source === "node:buffer") {
            return fileURLToPath(new URL("./node_modules/buffer/index.js", import.meta.url));
          }
          return null;
        },
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
