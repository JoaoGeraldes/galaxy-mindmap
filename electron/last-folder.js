// Where the desktop app records the folder it has open, so other tools on
// this computer, such as the MCP server in mcp/, can find the user's maps.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const FILE = path.join(os.homedir(), '.galaxy-mindmap', 'last-folder.json');

export async function rememberFolder(folder) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ folder }), 'utf8');
}

export async function recallFolder() {
  try {
    const { folder } = JSON.parse(await readFile(FILE, 'utf8'));
    return typeof folder === 'string' ? folder : null;
  } catch {
    return null;
  }
}
