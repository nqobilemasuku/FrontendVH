// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Deploy target. By default Nitro only runs inside the Lovable sandbox, so a
  // self-hosted build (e.g. on Vercel) ships NO server and every route 404s.
  // Force Nitro on and pin the Vercel preset so the build emits Vercel's
  // Build Output API (.vercel/output), which Vercel serves natively.
  nitro: { preset: "vercel" },
  // Dev-only proxy: the browser calls same-origin `/api/*`, the dev server
  // forwards it to the backend server-side — so there's no cross-origin request
  // and no CORS to satisfy while developing locally.
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "https://varsityhubapi-production.up.railway.app",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
});
