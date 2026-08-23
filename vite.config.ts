import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 프로젝트 사이트는 서브패스(/<repo>/)로 서비스되므로 base를 맞춰야 한다.
// 배포 워크플로가 VITE_BASE=/<repo>/ 를 주입한다. 로컬 개발은 '/'.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      workbox: {
        // 앱 셸과 시나리오 데이터가 전부 번들에 있으므로 precache만으로 완전 오프라인 동작.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: '머더미스터리 진행 도구',
        short_name: '머더미스터리',
        description: '오프라인 머더미스터리 게임 진행 보조 도구',
        lang: 'ko',
        theme_color: '#0c1220',
        background_color: '#070b14',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
