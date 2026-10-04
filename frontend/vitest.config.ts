import { defineConfig } from 'vitest/config';

// Konfigurasi terpisah dari vite.config.ts supaya build produksi (babel react-compiler) tidak ikut diuji.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
