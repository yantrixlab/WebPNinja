// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://webpninja.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        '@jsquash/jpeg',
        '@jsquash/webp',
        '@jsquash/avif',
        '@jsquash/png',
        '@jsquash/oxipng',
        'image-q',
      ],
    },
    worker: {
      format: 'es',
    },
  },
});
