import type { MapFolder, StoredValue } from './folder';
import type { MapFile } from './projects';

/** The parts of the File System Access API used here, so tests can fake them. */
export interface Directory {
  name: string;
  values(): AsyncIterable<{ kind: string; name: string }>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileEntry>;
  removeEntry(name: string): Promise<void>;
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
}

interface FileEntry {
  getFile(): Promise<{ text(): Promise<string>; lastModified: number }>;
  createWritable(): Promise<{
    write(text: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

/** Maps kept in a folder the user grants the browser access to. */
export function webFolder(
  pickDirectory: () => Promise<Directory>,
  lastDirectory: StoredValue<Directory>,
): MapFolder {
  let directory: Directory | null = null;

  function current(): Directory {
    if (!directory) throw new Error('No folder is open.');
    return directory;
  }

  async function read(file: string) {
    return (await current().getFileHandle(file)).getFile();
  }

  async function write(file: string, text: string) {
    // The browser writes to a temporary file and swaps it in on close,
    // so a failed save never leaves a half-written map behind.
    const writable = await (
      await current().getFileHandle(file, { create: true })
    ).createWritable();
    await writable.write(text);
    await writable.close();
  }

  // Browsers can't reliably move files yet, so moving is copy then delete.
  async function move(from: string, to: string) {
    await write(to, await (await read(from)).text());
    await current().removeEntry(from);
  }

  return {
    removesToTrash: false,

    async chooseFolder() {
      try {
        directory = await pickDirectory();
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return null;
        throw error;
      }
      await lastDirectory.save(directory);
      return directory.name;
    },

    async reopenFolder() {
      const saved = await lastDirectory.load();
      // Asking for permission again needs a click, so without it the
      // user simply chooses the folder again.
      const granted =
        saved && (await saved.queryPermission({ mode: 'readwrite' }));
      if (granted !== 'granted') return null;
      directory = saved!;
      return directory.name;
    },

    async readMaps() {
      const maps: MapFile[] = [];
      for await (const { kind, name } of current().values()) {
        if (kind !== 'file' || !name.endsWith('.json')) continue;
        const file = await read(name);
        maps.push({
          file: name,
          text: await file.text(),
          modifiedAt: new Date(file.lastModified).toISOString(),
        });
      }
      return maps;
    },

    writeMap: write,

    async renameMap(from, to) {
      // On case-insensitive disks "a.json" and "A.json" are one file, so
      // copying straight across would delete the map it just wrote.
      if (from.toLowerCase() === to.toLowerCase()) {
        await move(from, `${to}.tmp`);
        await move(`${to}.tmp`, to);
      } else {
        await move(from, to);
      }
    },

    removeMap: (file) => current().removeEntry(file),
  };
}
