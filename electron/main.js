import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import {
  access,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const isDev = process.argv.includes('--dev');
let mainWindow = null;
let folder = null;

function currentFolder() {
  if (!folder) throw new Error('No folder is open.');
  return folder;
}

// Only bare .json names are accepted, so the window can never reach
// files outside the folder the user chose.
function mapPath(file) {
  if (file !== path.basename(file) || !file.endsWith('.json')) {
    throw new Error(`Invalid file name: ${file}`);
  }
  return path.join(currentFolder(), file);
}

const handlers = {
  async chooseFolder() {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose the folder for your mind maps',
      buttonLabel: 'Use this folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (canceled) return null;
    folder = filePaths[0];
    return folder;
  },

  async openFolder(candidate) {
    try {
      await access(candidate);
      folder = candidate;
      return true;
    } catch {
      return false;
    }
  },

  async readMaps() {
    const entries = await readdir(currentFolder(), { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name);
    return Promise.all(
      files.map(async (file) => ({
        file,
        text: await readFile(mapPath(file), 'utf8'),
        modifiedAt: (await stat(mapPath(file))).mtime.toISOString(),
      })),
    );
  },

  async writeMap(file, text) {
    // Writing a temporary file first means a crash mid-save can never
    // leave a half-written map behind.
    const target = mapPath(file);
    await writeFile(`${target}.tmp`, text, 'utf8');
    await rename(`${target}.tmp`, target);
  },

  async renameMap(from, to) {
    await rename(mapPath(from), mapPath(to));
  },

  async trashMap(file) {
    await shell.trashItem(mapPath(file));
  },

  async showFolder() {
    if (folder) await shell.openPath(folder);
  },
};

for (const [name, handler] of Object.entries(handlers)) {
  ipcMain.handle(name, (_event, ...args) => handler(...args));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Mind Map',
    webPreferences: { preload: path.join(import.meta.dirname, 'preload.cjs') },
  });

  if (isDev) {
    const { createServer } = await import('vite');
    const server = await createServer({
      root: path.join(import.meta.dirname, '..'),
    });
    await server.listen();
    await mainWindow.loadURL(server.resolvedUrls.local[0]);
  } else {
    await mainWindow.loadFile(
      path.join(import.meta.dirname, '../dist/index.html'),
    );
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
