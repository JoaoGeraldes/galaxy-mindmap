import { mount } from 'svelte';
import App from './App.svelte';
// Bundled with the app rather than loaded online, so it works offline too.
import '@fontsource-variable/archivo';
import './app.css';
import { browserFolder } from './lib/browser-folder';
import { desktopFolder } from './lib/desktop-folder';
import type { MapFolder } from './lib/folder';
import {
  defaultPreferences,
  readPreferences,
  type Preferences,
  type PreferenceStore,
} from './lib/preferences';
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

const PREFERENCES_KEY = 'galaxy-mind-map:preferences';

// Preferences belong to the device, not to a map, so they live in the
// browser's own storage, which Electron keeps too.
const preferenceStore: PreferenceStore = {
  load: () =>
    readPreferences(
      localStorage.getItem(PREFERENCES_KEY),
      defaultPreferences({
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersLight: matchMedia('(prefers-color-scheme: light)').matches,
      }),
    ),
  save(preferences) {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    applyTheme(preferences);
  },
};

function applyTheme({ theme }: Preferences) {
  document.documentElement.dataset.theme = theme;
}

// Set before the first paint, so a light theme never flashes dark.
applyTheme(preferenceStore.load());

mount(App, {
  target: document.getElementById('app')!,
  props: {
    storage: platformFolder(),
    preferenceStore,
    aiSetup: window.files && (() => window.files!.aiSetup()),
  },
});
