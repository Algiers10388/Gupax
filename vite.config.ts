import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Gupax for Android',
          short_name: 'Gupax',
          description: 'Mobile P2Pool and XMRig mining manager, remote monitor, and ARM configuration suite for Android devices.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'download-attachment-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url) {
              const urlPath = req.url.split('?')[0];
              const match = urlPath.match(/\/([^\/]+\.(whl|tar\.gz|zip|py|sh|json))$/i);
              if (match) {
                const filename = match[1];
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                if (filename.endsWith('.whl')) {
                  res.setHeader('Content-Type', 'application/x-wheel+zip');
                } else if (filename.endsWith('.tar.gz')) {
                  res.setHeader('Content-Type', 'application/gzip');
                } else if (filename.endsWith('.zip')) {
                  res.setHeader('Content-Type', 'application/zip');
                } else if (filename.endsWith('.json')) {
                  res.setHeader('Content-Type', 'application/json');
                } else if (filename.endsWith('.py') || filename.endsWith('.sh')) {
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                }
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
    },
  };
});
