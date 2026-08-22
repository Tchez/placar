import type { Preset } from '@vite-pwa/assets-generator/config';
import { defineConfig } from '@vite-pwa/assets-generator/config';

const appBackground = '#0b1016';

const preset: Preset = {
  transparent: {
    sizes: [192, 512],
    padding: 0,
    favicons: [[48, 'favicon.ico']],
    resizeOptions: {
      background: appBackground,
      fit: 'contain',
    },
  },
  maskable: {
    sizes: [512],
    padding: 0.41,
    resizeOptions: {
      background: appBackground,
      fit: 'contain',
    },
  },
  apple: {
    sizes: [180],
    padding: 0,
    resizeOptions: {
      background: appBackground,
      fit: 'contain',
    },
  },
};

export default defineConfig({
  images: ['public/icon-master.png'],
  preset,
  manifestIconsEntry: false,
});
