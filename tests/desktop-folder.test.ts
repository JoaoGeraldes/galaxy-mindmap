import { describe, expect, it } from 'vitest';
import { desktopFolder, type DesktopFiles } from '../src/lib/desktop-folder';
import { memoryStore } from '../src/lib/store';

function settings(lastFolder?: string) {
  return memoryStore(lastFolder ? { 'last-folder': lastFolder } : {});
}

function fakeFiles(overrides: Partial<DesktopFiles> = {}): DesktopFiles {
  return {
    chooseFolder: async () => 'C:\\Maps',
    openFolder: async () => true,
    readMaps: async () => [],
    writeMap: async () => {},
    renameMap: async () => {},
    trashMap: async () => {},
    showFolder: async () => {},
    ...overrides,
  };
}

describe('desktop folder', () => {
  it('remembers the chosen folder for next time', async () => {
    const store = settings();
    await desktopFolder(fakeFiles(), store).chooseFolder!();
    expect(await store.get('last-folder')).toBe('C:\\Maps');
  });

  it('forgets nothing when choosing is cancelled', async () => {
    const store = settings('C:\\Old');
    const files = fakeFiles({ chooseFolder: async () => null });
    expect(await desktopFolder(files, store).chooseFolder!()).toBeNull();
    expect(await store.get('last-folder')).toBe('C:\\Old');
  });

  it('reopens the remembered folder', async () => {
    const folder = desktopFolder(fakeFiles(), settings('C:\\Maps'));
    expect(await folder.reopenFolder()).toBe('C:\\Maps');
  });

  it('has nothing to reopen on first launch', async () => {
    expect(
      await desktopFolder(fakeFiles(), settings()).reopenFolder(),
    ).toBeNull();
  });

  it('explains when the remembered folder has gone', async () => {
    const files = fakeFiles({ openFolder: async () => false });
    await expect(
      desktopFolder(files, settings('D:\\Maps')).reopenFolder(),
    ).rejects.toThrow('“D:\\Maps” could not be found.');
  });

  it('removes maps to the trash', async () => {
    const trashed: string[] = [];
    const files = fakeFiles({
      trashMap: async (file) => void trashed.push(file),
    });
    const folder = desktopFolder(files, settings());
    await folder.removeMap('Ideas.json');
    expect(folder.removesToTrash).toBe(true);
    expect(trashed).toEqual(['Ideas.json']);
  });

  it('hides Electron’s technical prefix from error messages', async () => {
    const files = fakeFiles({
      writeMap: async () => {
        throw new Error(
          "Error invoking remote method 'writeMap': Error: Disk is full",
        );
      },
    });
    await expect(
      desktopFolder(files, settings()).writeMap('a.json', '{}'),
    ).rejects.toThrow(/^Disk is full$/);
  });
});
