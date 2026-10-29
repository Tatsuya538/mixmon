/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig(({ mode }) => {
  // artifact: claude.ai の Artifact として URL 共有するためのビルド（PWAなし・1ファイル化前提）
  const artifact = mode === 'artifact';
  return {
    // Capacitor（file://）でも動くよう相対パスで出力する
    base: './',
    resolve: {
      alias: { '@fonts': src(artifact ? 'fonts.empty.ts' : 'fonts.ts') },
    },
    // Artifact は1つのHTMLにまとめるため、モンスター画像も data URI として JS に埋め込む
    build: artifact ? { outDir: 'dist-artifact', cssCodeSplit: false, assetsInlineLimit: 50 * 1024 * 1024 } : undefined,
    plugins: [
      react(),
      !artifact &&
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg', 'apple-touch-icon.png'],
          manifest: {
            name: 'ミクスモン',
            short_name: 'ミクスモン',
            lang: 'ja',
            start_url: './',
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#1b1633',
            theme_color: '#1b1633',
            icons: [
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,woff2,png,webp,jpg,jpeg}'],
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          },
        }),
    ],
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
