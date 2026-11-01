import type { MapFile } from './projects';

/**
 * Where maps are kept. The app depends only on this, so each platform
 * (desktop, web) plugs in its own implementation without the app knowing.
 */
export interface MapFolder {
  /** Asks the user for a folder; resolves to its name, or null if cancelled. */
  chooseFolder(): Promise<string | null>;
  /** Reopens the last folder used, or resolves to null if there is none. */
  reopenFolder(): Promise<string | null>;
  readMaps(): Promise<MapFile[]>;
  writeMap(file: string, text: string): Promise<void>;
  renameMap(from: string, to: string): Promise<void>;
  removeMap(file: string): Promise<void>;
  /** Whether removed maps go to a trash they can be restored from. */
  removesToTrash: boolean;
  /** Opens the folder in the system's file explorer, where there is one. */
  showFolder?(): Promise<void>;
}

/** A single value kept between visits. */
export interface StoredValue<T> {
  load(): Promise<T | undefined>;
  save(value: T): Promise<void>;
}
