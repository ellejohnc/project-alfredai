/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      // src/test/edge-functions/** are INTEGRATION tests: they POST to the
      // deployed Supabase functions, using the real URL and anon key from .env.
      // That means a plain `vitest run` sends live requests to production — and
      // one of those functions, notify-new-lead, sends email. They also cannot
      // pass in a sandboxed session at all, because the egress proxy blocks the
      // Supabase host, which is why 19 of them sat red without ever being a
      // real defect.
      //
      // Opt in deliberately when there is a reason to exercise production:
      //   RUN_EDGE_TESTS=1 npx vitest run src/test/edge-functions
      exclude: [
        'node_modules',
        'dist',
        ...(env.RUN_EDGE_TESTS ? [] : ['src/test/edge-functions/**']),
      ],
      testTimeout: 30000, // 30s for integration tests
      hookTimeout: 30000,
      env: {
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
