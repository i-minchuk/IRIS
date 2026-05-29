import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
var packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
        host: true,
        proxy: {
            '/api': { target: 'http://localhost:8000', changeOrigin: true },
            '/ws': { target: 'http://localhost:8000', ws: true },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // ← define ДОЛЖЕН БЫТЬ ЗДЕСЬ, на уровне с resolve и server
    define: {
        __APP_VERSION__: JSON.stringify(packageJson.version),
        __BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
    },
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
        },
    },
    build: {
        assetsDir: 'assets',
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/'))
                        return 'vendor-react';
                    if (id.includes('node_modules/react-router-dom/'))
                        return 'vendor-router';
                    if (id.includes('node_modules/recharts/'))
                        return 'vendor-charts';
                    if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/lucide-react/'))
                        return 'vendor-ui';
                },
            },
        },
    }
});
