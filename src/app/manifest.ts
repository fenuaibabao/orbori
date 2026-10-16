import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Orbori',
    short_name: 'Orbori',
    description: 'Where the stars agree. Seven traditions, one daily reading.',
    start_url: '/today',
    display: 'standalone',
    background_color: '#060528',
    theme_color: '#060528',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
