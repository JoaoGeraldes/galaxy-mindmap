import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import {
  access,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { rememberFolder } from './last-folder.js';

const isDev = process.argv.includes('--dev');
let mainWindow = null;
let folder = null;
let watcher = null;

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

/**
 * Opens a folder: watches it, so maps other tools add (such as the MCP
 * server) show up in the app, and records it, so those tools can find it.
 */
function useFolder(chosen) {
  folder = chosen;
  watcher?.close();
  let settle;
  watcher = watch(folder, (_event, file) => {
    if (!file?.endsWith('.json')) return;
    // A save or rename fires several events; they settle into one message.
    clearTimeout(settle);
    settle = setTimeout(() => mainWindow?.webContents.send('mapsChanged'), 300);
  });
  // Only a convenience for other tools, so a failure here is ignored.
  rememberFolder(folder).catch(() => {});
}

const handlers = {
  async chooseFolder() {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose the folder for your mind maps',
      buttonLabel: 'Use this folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (canceled) return null;
    useFolder(filePaths[0]);
    return folder;
  },

  async openFolder(candidate) {
    try {
      await access(candidate);
      useFolder(candidate);
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

  /** How AI apps should start the MCP server, for the in-app guide. */
  async aiSetup() {
    // Installed, the app runs the server on its own built-in Node, from
    // outside its archive. While developing, plain Node runs the copy that
    // npm run mcp:build makes.
    const server = app.isPackaged
      ? path.join(
          process.resourcesPath,
          'app.asar.unpacked',
          'build',
          'mcp',
          'server.mjs',
        )
      : path.join(app.getAppPath(), 'build', 'mcp', 'server.mjs');
    const ready = await access(server).then(
      () => true,
      () => false,
    );
    return app.isPackaged
      ? {
          command: process.execPath,
          args: [server],
          env: { ELECTRON_RUN_AS_NODE: '1' },
          ready,
        }
      : { command: 'node', args: [server], ready };
  },
};

for (const [name, handler] of Object.entries(handlers)) {
  ipcMain.handle(name, (_event, ...args) => handler(...args));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Galaxy Mind Map',
    // Electron can't use SVG icons; icon.png is a 512px copy of src/assets/logo.svg.
    icon: path.join(import.meta.dirname, 'icon.png'),
    backgroundColor: '#07071a',
    webPreferences: { preload: path.join(import.meta.dirname, 'preload.cjs') },
  });

  // Links such as the website open in the person's browser, not in here.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
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

// Two copies would share one data folder, and the second can't use its
// storage ("Internal error."), so a second launch shows the first instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.focus();
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
