/// <reference types="vite/client" />

import type { DesktopFiles } from './lib/desktop-folder';

declare global {
  interface Window {
    /** Present only in the desktop app; see electron/preload.cjs. */
    files?: DesktopFiles;
  }
}
