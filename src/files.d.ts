import type { DesktopFiles } from './lib/desktop-folder';
import type { Directory } from './lib/web-folder';

declare global {
  interface Window {
    /** Present only in the desktop app; see electron/preload.cjs. */
    files?: DesktopFiles;
    /** Present only in browsers that support the File System Access API. */
    showDirectoryPicker?(options: { mode: 'readwrite' }): Promise<Directory>;
  }
}
