import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // export-pdf (jsPDF + html2canvas) and export-docx are lazy-loaded on demand — large size is expected
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache the SW or manifest themselves
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/manifest\.webmanifest$/, /^\/registerSW\.js$/],
      },
      manifest: {
        name: 'FichesPro — Créateur de fiches enseignant',
        short_name: 'FichesPro',
        description: 'Créez vos fiches d\'exercices et de synthèse facilement',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
})
