import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Modul yang paling sering dibuka ditransformasi sejak server dev menyala.
    // Tanpa ini, klik halaman pertama menunggu transformasi on-the-fly.
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/layout/*.tsx',
        './src/features/monitoring/**/*.tsx',
        './src/features/monitoring/hooks/*.ts',
      ],
    },
  },
  build: {
    // target default Vite sudah modern; es2022 menutupi browser yang masih
    // umum tanpa menghasilkan transpilasi berlebih (bundle lebih kecil).
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Kerangka React dipisah agar bisa di-cache lintas deploy dan tidak
          // ikut terunduh ulang saat hanya kode fitur yang berubah.
          const path = id.replace(/\\/g, '/')
          if (
            path.includes('node_modules/react-router') ||
            path.includes('node_modules/react-dom') ||
            path.includes('node_modules/react/') ||
            path.includes('node_modules/scheduler')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
