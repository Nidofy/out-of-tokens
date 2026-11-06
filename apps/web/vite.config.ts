import { defineConfig } from 'vite';
export default defineConfig({
    base: './',
    plugins: [{ name: 'browser-only-boundary', enforce: 'pre', resolveId(id) {
                if (id.startsWith('node:'))
                    throw Error('NODE_IMPORT_IN_BROWSER:' + id);
                return null;
            } }],
    esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
    build: { target: 'es2022', chunkSizeWarningLimit: 800 },
    server: { port: 5173, strictPort: true }, preview: { port: 4173, strictPort: true }
});
