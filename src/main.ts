import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { desktopFolder } from './lib/desktop-folder';
import type { MapFolder } from './lib/folder';
import { indexedDbValue } from './lib/stored-value';
import { webFolder, type Directory } from './lib/web-folder';

// The one place that knows which platform the app runs on.
function platformFolder(): MapFolder {
  if (window.files) {
    return desktopFolder(window.files, indexedDbValue('desktop-folder'));
  }
  return webFolder(pickDirectory, indexedDbValue('web-folder'));
}

async function pickDirectory(): Promise<Directory> {
  if (!window.showDirectoryPicker) {
    throw new Error(
      "This browser can't open folders. Try Chrome or Edge, or the desktop app.",
    );
  }
  return window.showDirectoryPicker({ mode: 'readwrite' });
}

mount(App, {
  target: document.getElementById('app')!,
  props: { storage: platformFolder() },
});
