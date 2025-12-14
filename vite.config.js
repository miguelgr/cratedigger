import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public', // We might need to move static assets here or configure it differently. 
  // Looking at the structure, resources are in src/images, src/fonts etc.
  // Vite serves from root (src). So src/images/foo.png is available at /images/foo.png if we are not careful about base.
  // Actually, in Vite, typically you put index.html in root. 
  // But the current project has index.html? No, I didn't see index.html in root or src. 
  // Let me check src content again.
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    open: true,
    proxy: {
      '/img-proxy': {
        target: 'https://i.discogs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Remove security headers that might block usage in canvas
            // And ensure Access-Control-Allow-Origin is set
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        }
      }
    }
  }
});
