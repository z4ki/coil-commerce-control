import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.TAURI_PLATFORM ? './' : '/',
  server: {
    host: "::",
    port: 8080,
    strictPort:true
  },
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@tauri-apps/api': require.resolve('@tauri-apps/api')
    },
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  },
  esbuild: {
    supported: {
      'top-level-await': true
    },
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
  },
}));
