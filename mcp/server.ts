// An MCP server that lets AI apps create mind maps as files. AI apps start
// it and talk to it over stdin and stdout; see "AI assistants" in the README.
import { access, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { version } from '../package.json';
import { recallFolder } from '../electron/last-folder.js';
import { answer, createMapTool, firstExisting } from '../src/lib/mcp';
import { fileNameFor, serializeMap, type SavedMap } from '../src/lib/projects';

const flag = process.argv.indexOf('--folder');
const configuredFolder =
  flag > 0 ? process.argv[flag + 1] : process.env.GALAXY_MIND_MAP_FOLDER;

const exists = (folder: string) =>
  access(folder).then(
    () => true,
    () => false,
  );

async function save(map: SavedMap) {
  const appFolder = await recallFolder();
  const destination = await firstExisting(
    [
      configuredFolder && { folder: configuredFolder, kind: 'configured' },
      appFolder && { folder: appFolder, kind: 'app' },
      { folder: path.join(os.homedir(), 'Downloads'), kind: 'downloads' },
    ],
    exists,
  );
  if (!destination) {
    throw new Error('Found no folder to save in. Set one with --folder.');
  }
  const taken = (await readdir(destination.folder)).filter((name) =>
    name.endsWith('.json'),
  );
  const file = fileNameFor(map.root.text, taken);
  // 'wx' never overwrites, should a file of that name appear meanwhile.
  await writeFile(path.join(destination.folder, file), serializeMap(map), {
    encoding: 'utf8',
    flag: 'wx',
  });
  return { file, destination };
}

const tools = [createMapTool(save)];
const send = (message: object) =>
  process.stdout.write(`${JSON.stringify(message)}\n`);

createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let message: unknown;
  try {
    message = JSON.parse(line);
  } catch {
    return send({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'That message is not valid JSON.' },
    });
  }
  const reply = await answer(message, tools, {
    name: 'galaxy-mind-map',
    version,
  });
  if (reply) send(reply);
});
