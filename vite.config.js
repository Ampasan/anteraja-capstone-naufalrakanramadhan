import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { shipmentApiPlugin } from './server/shipment-api.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), shipmentApiPlugin()],
  server: {
    headers: {
      // Pastikan file JSON dari /public/data tidak di-cache browser saat dev
      'Cache-Control': 'no-store',
    },
  },
})
