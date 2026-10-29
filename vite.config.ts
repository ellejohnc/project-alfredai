import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

const deployNonce =
  process.env.LOVABLE_DEPLOY_NONCE ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.CF_PAGES_COMMIT_SHA?.slice(0, 8) ||
  Date.now().toString(36);

// Dev-only proxy: Lovable CDN assets (/__l5e/) are served by Lovable's
// infrastructure on preview and production hosts, not by the sandbox Vite
// server, so forward them there to keep local previews accurate.
const ASSET_PROXY_TARGET =
  process.env.LOVABLE_PREVIEW_ORIGIN ||
  "https://id-preview--275288ac-40ef-4d91-9801-29d14103a021.lovable.app";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/__l5e": {
        target: ASSET_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mcpPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Dedupe ensures all imports resolve to the same physical copy
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "framer-motion",
      "react-router-dom",
      "next-themes",
      "embla-carousel-react",
    ],
  },
  optimizeDeps: {
    // Force prebundling of React ecosystem so they share one instance
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "framer-motion",
      "react-router-dom",
      "next-themes",
      "embla-carousel-react",
    ],
    force: true,
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  // Fresh cache to drop stale chunks
  cacheDir: ".vite-cache-v12",
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${deployNonce}.js`,
        chunkFileNames: `assets/[name]-[hash]-${deployNonce}.js`,
        assetFileNames: `assets/[name]-[hash]-${deployNonce}[extname]`,
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "framer-motion": ["framer-motion"],
          "react-query": ["@tanstack/react-query"],
          "router": ["react-router-dom"],
          "supabase": ["@supabase/supabase-js"],
          "recharts": ["recharts"],
          // Split lucide-react into its own chunk — it's 158KB and was loading eagerly
          "lucide-icons": ["lucide-react"],
          // Tiptap editor — only needed on admin routes
          "tiptap-editor": [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-link",
            "@tiptap/extension-image",
            "@tiptap/extension-placeholder",
          ],
        },
      },
    },
  },
}));
