import type { MapFolder, StoredValue } from './folder';
import type { MapFile } from './projects';

/** What electron/preload.cjs exposes as `window.files`. */
export interface DesktopFiles {
  chooseFolder(): Promise<string | null>;
  /** Resolves to false if the folder no longer exists. */
  openFolder(path: string): Promise<boolean>;
  readMaps(): Promise<MapFile[]>;
  writeMap(file: string, text: string): Promise<void>;
  renameMap(from: string, to: string): Promise<void>;
  trashMap(file: string): Promise<void>;
  showFolder(): Promise<void>;
}

/** Maps kept in a folder on disk, through the Electron main process. */
export function desktopFolder(
  files: DesktopFiles,
  lastPath: StoredValue<string>,
): MapFolder {
  return {
    removesToTrash: true,

    async chooseFolder() {
      const path = await desktopCall(files.chooseFolder());
      if (path) await lastPath.save(path);
      return path;
    },

    async reopenFolder() {
      const path = await lastPath.load();
      if (!path) return null;
      if (await desktopCall(files.openFolder(path))) return path;
      throw new Error(
        `“${path}” could not be found. It may have been moved, renamed or disconnected.`,
      );
    },

    readMaps: () => desktopCall(files.readMaps()),
    writeMap: (file, text) => desktopCall(files.writeMap(file, text)),
    renameMap: (from, to) => desktopCall(files.renameMap(from, to)),
    removeMap: (file) => desktopCall(files.trashMap(file)),
    showFolder: () => desktopCall(files.showFolder()),
  };
}

// Electron wraps errors from the main process in a technical prefix
// that means nothing to the user.
async function desktopCall<T>(call: Promise<T>): Promise<T> {
  try {
    return await call;
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    throw new Error(
      message.replace(/^Error invoking remote method '\w+': (Error: )?/, ''),
    );
  }
}
