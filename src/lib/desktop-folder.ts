import type { MapFolder } from './folder';
import type { McpSetup } from './mcp-setup';
import type { MapFile } from './projects';
import type { Store } from './store';

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
  /** Returns a function that stops listening. */
  onMapsChanged(listener: () => void): () => void;
  /** How AI apps should start the MCP server on this computer. */
  aiSetup(): Promise<McpSetup>;
}

const LAST_FOLDER = 'last-folder';

/** Maps kept in a folder on disk, through the Electron main process. */
export function desktopFolder(
  files: DesktopFiles,
  settings: Store<string>,
): MapFolder {
  return {
    removesToTrash: true,

    async chooseFolder() {
      const path = await desktopCall(files.chooseFolder());
      // Remembering is a convenience: if storage fails, the folder still
      // opens, and the app just asks for it again next time.
      if (path) await settings.set(LAST_FOLDER, path).catch(() => {});
      return path;
    },

    async reopenFolder() {
      const path = await settings.get(LAST_FOLDER).catch(() => undefined);
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
    onChange: (listener) => files.onMapsChanged(listener),
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
