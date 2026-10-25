import type { MapFile } from './lib/projects';

/** File access provided by electron/preload.cjs. */
interface MapFolder {
  /** Asks the user for a folder; resolves to its path, or null if cancelled. */
  chooseFolder(): Promise<string | null>;
  /** Reopens a known folder; resolves to false if it no longer exists. */
  openFolder(path: string): Promise<boolean>;
  readMaps(): Promise<MapFile[]>;
  writeMap(file: string, text: string): Promise<void>;
  renameMap(from: string, to: string): Promise<void>;
  /** Moves a map to the system trash, so it can be restored. */
  trashMap(file: string): Promise<void>;
  showFolder(): Promise<void>;
}

declare global {
  interface Window {
    files: MapFolder;
  }
}
