import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { browserFolder } from './lib/browser-folder';
import { desktopFolder } from './lib/desktop-folder';
import type { MapFolder } from './lib/folder';
import { indexedDbStore } from './lib/store';

// The one place that knows which platform the app runs on.
function platformFolder(): MapFolder {
  if (window.files) {
    return desktopFolder(window.files, indexedDbStore('mind-map-settings'));
  }
  // Without this the browser may clear the maps when it runs low on space.
  navigator.storage?.persist?.();
  return browserFolder(indexedDbStore('mind-map-maps'));
}

mount(App, {
  target: document.getElementById('app')!,
  props: { storage: platformFolder() },
});
