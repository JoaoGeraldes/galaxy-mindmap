import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ isSsrBuild }) => ({
  // Relative paths so Electron can load the built files from disk.
  base: './',
  plugins: [svelte()],
  // The MCP server (npm run mcp:build) ends in .mjs so Node runs it as a
  // module even where no package.json says so, as inside the installed app.
  build: isSsrBuild
    ? { rollupOptions: { output: { entryFileNames: '[name].mjs' } } }
    : {},
}));
