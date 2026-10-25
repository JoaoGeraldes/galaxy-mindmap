import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Relative paths so Electron can load the built files from disk.
  base: './',
  plugins: [svelte()],
});
