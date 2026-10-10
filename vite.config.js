import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Bataille de Po/ets',
        short_name: 'Bataille',
        description: 'Jeu de cartes deckbuilding absurde entre potes',
        theme_color: '#ff3fb4',
        background_color: '#fff4fb',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // ne jamais mettre en cache les appels Supabase (bug connu sur la Bibliotheque BD)
        navigateFallbackDenylist: [/^\/api/, /supabase/],
        runtimeCaching: [{
          urlPattern: ({url}) => url.origin.includes('supabase'),
          handler: 'NetworkOnly'
        }]
      }
    })
  ]
})
