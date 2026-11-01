import type { MapFolder } from './folder';
import type { MapFile } from './projects';
import type { Store } from './store';

/** What is kept for each map, keyed by its file name. */
export type StoredMap = Omit<MapFile, 'file'>;

export const BROWSER_PLACE = 'This browser';

/**
 * Maps kept in the browser's own storage. There's no folder to choose:
 * maps reach the disk only through import and export.
 */
export function browserFolder(
  maps: Store<StoredMap>,
  now = () => new Date(),
): MapFolder {
  async function stored(file: string): Promise<StoredMap> {
    const map = await maps.get(file);
    if (!map) throw new Error(`${file} is no longer in this browser.`);
    return map;
  }

  return {
    removesToTrash: false,

    reopenFolder: async () => BROWSER_PLACE,

    async readMaps() {
      const entries = await maps.entries();
      return entries.map(([file, map]) => ({ file, ...map }));
    },

    writeMap: (file, text) =>
      maps.set(file, { text, modifiedAt: now().toISOString() }),

    async renameMap(from, to) {
      await maps.set(to, await stored(from));
      await maps.delete(from);
    },

    removeMap: (file) => maps.delete(file),
  };
}
