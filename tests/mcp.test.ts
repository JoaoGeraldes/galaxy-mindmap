import { describe, expect, it } from 'vitest';
import {
  PROTOCOL_VERSIONS,
  answer,
  createMapTool,
  firstExisting,
  type Destination,
} from '../src/lib/mcp';
import type { SavedMap } from '../src/lib/projects';

const SERVER = { name: 'galaxy-mind-map', version: '1.0.0' };
const DOWNLOADS: Destination = {
  folder: '/home/me/Downloads',
  kind: 'downloads',
};

function toolSavingTo(destination: Destination) {
  const saved: SavedMap[] = [];
  const tool = createMapTool(async (map) => {
    saved.push(map);
    return { file: 'trip.json', destination };
  });
  return { tool, saved };
}

const call = (args: object) => ({
  jsonrpc: '2.0',
  id: 7,
  method: 'tools/call',
  params: { name: 'create_mind_map', arguments: args },
});

describe('mcp', () => {
  it('agrees on the protocol version the AI app asks for', async () => {
    const reply = (await answer(
      {
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26' },
      },
      [],
      SERVER,
    )) as { result: { protocolVersion: string; serverInfo: object } };
    expect(reply.result.protocolVersion).toBe('2025-03-26');
    expect(reply.result.serverInfo).toEqual(SERVER);
  });

  it('offers its newest protocol version when asked for an unknown one', async () => {
    const reply = (await answer(
      {
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '1999-01-01' },
      },
      [],
      SERVER,
    )) as { result: { protocolVersion: string } };
    expect(reply.result.protocolVersion).toBe(PROTOCOL_VERSIONS[0]);
  });

  it('lists the tools it offers', async () => {
    const { tool } = toolSavingTo(DOWNLOADS);
    const reply = (await answer(
      { id: 2, method: 'tools/list' },
      [tool],
      SERVER,
    )) as {
      result: { tools: { name: string }[] };
    };
    expect(reply.result.tools.map((t) => t.name)).toEqual(['create_mind_map']);
  });

  it('never answers notifications', async () => {
    const message = { method: 'notifications/initialized' };
    expect(await answer(message, [], SERVER)).toBeUndefined();
  });

  it('creates and saves a map when asked', async () => {
    const { tool, saved } = toolSavingTo({ folder: '/maps', kind: 'app' });
    const reply = (await answer(
      call({ title: 'Trip', ideas: [{ text: 'Packing' }] }),
      [tool],
      SERVER,
    )) as { result: { content: { text: string }[]; isError?: boolean } };
    expect(saved[0].root.text).toBe('Trip');
    expect(reply.result.isError).toBeUndefined();
    expect(reply.result.content[0].text).toContain('trip.json in /maps');
  });

  it('tells web users to import a map saved to Downloads', async () => {
    const { tool } = toolSavingTo(DOWNLOADS);
    const text = await tool.run({ title: 'Trip', ideas: [] });
    expect(text).toContain('choose Import');
  });

  it('reports a malformed outline as a problem the AI can fix', async () => {
    const { tool, saved } = toolSavingTo(DOWNLOADS);
    const reply = (await answer(
      call({ title: '', ideas: [] }),
      [tool],
      SERVER,
    )) as {
      result: { content: { text: string }[]; isError: boolean };
    };
    expect(reply.result.isError).toBe(true);
    expect(reply.result.content[0].text).toContain('The title needs');
    expect(saved).toHaveLength(0);
  });

  it('rejects unknown tools and methods', async () => {
    const unknownTool = (await answer(
      { id: 3, method: 'tools/call', params: { name: 'nope' } },
      [],
      SERVER,
    )) as { error: { code: number } };
    const unknownMethod = (await answer(
      { id: 4, method: 'nope' },
      [],
      SERVER,
    )) as {
      error: { code: number };
    };
    expect(unknownTool.error.code).toBe(-32602);
    expect(unknownMethod.error.code).toBe(-32601);
  });

  it('saves to the first folder that exists, in order of preference', async () => {
    const existing = new Set(['/app-folder', '/home/me/Downloads']);
    const exists = async (folder: string) => existing.has(folder);
    const chosen = await firstExisting(
      [
        { folder: '/gone', kind: 'configured' },
        null,
        { folder: '/app-folder', kind: 'app' },
        DOWNLOADS,
      ],
      exists,
    );
    expect(chosen).toEqual({ folder: '/app-folder', kind: 'app' });
  });
});
