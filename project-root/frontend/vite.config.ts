import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  css: {
    modules: {
      // kebab-case в *.module.css => camelCase в JS (styles.pdfContainer -> .pdf-container)
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/')
          ) {
            return 'react-core';
          }

          if (
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/@remix-run/')
          ) {
            return 'router';
          }

          if (id.includes('/lucide-react/')) {
            return 'icons';
          }

          if (
            id.includes('/xlsx/') ||
            id.includes('/exceljs/') ||
            id.includes('/sheetjs/') ||
            id.includes('/xlsx-populate/')
          ) {
            return 'excel';
          }

          if (
            id.includes('/chart.js/') ||
            id.includes('/recharts/') ||
            id.includes('/d3/') ||
            id.includes('/apexcharts/')
          ) {
            return 'charts';
          }

          if (
            id.includes('/axios/') ||
            id.includes('/date-fns/') ||
            id.includes('/zod/') ||
            id.includes('/clsx/') ||
            id.includes('/tailwind-merge/')
          ) {
            return 'vendor-utils';
          }

          return 'vendor';
        },
      },
    },
  },
});