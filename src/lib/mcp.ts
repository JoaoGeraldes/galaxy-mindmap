import { mapFromOutline } from './outline';
import type { SavedMap } from './projects';

/**
 * The Model Context Protocol, as far as this app needs it: AI apps send
 * one JSON-RPC message per line and call the tools listed here.
 */

export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  /** Resolves to a message for the AI; throwing reports a fixable problem. */
  run(args: Record<string, unknown>): Promise<string>;
}

/** Newest first; an AI app asking for one of these gets it back. */
export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

interface Message {
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

/** Answers one message. Notifications, which have no id, get no answer. */
export async function answer(
  message: unknown,
  tools: Tool[],
  serverInfo: { name: string; version: string },
): Promise<object | undefined> {
  const { id, method, params = {} } = (message ?? {}) as Message;
  if (id === undefined || id === null) return;
  const reply = (result: object) => ({ jsonrpc: '2.0', id, result });
  const fail = (code: number, text: string) => ({
    jsonrpc: '2.0',
    id,
    error: { code, message: text },
  });

  switch (method) {
    case 'initialize': {
      const asked = params.protocolVersion as string;
      return reply({
        protocolVersion: PROTOCOL_VERSIONS.includes(asked)
          ? asked
          : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: tools.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema,
        })),
      });
    case 'tools/call': {
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) return fail(-32602, `There is no tool called ${params.name}.`);
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      try {
        return reply({
          content: [{ type: 'text', text: await tool.run(args) }],
        });
      } catch (error) {
        const text = String((error as Error)?.message ?? error);
        return reply({ content: [{ type: 'text', text }], isError: true });
      }
    }
    default:
      return fail(-32601, `Unknown method: ${method}.`);
  }
}

/** Where a new map can go, in order of preference. */
export interface Destination {
  folder: string;
  kind: 'configured' | 'app' | 'downloads';
}

/** The first destination whose folder exists. */
export async function firstExisting(
  candidates: (Destination | null | undefined | '')[],
  exists: (folder: string) => Promise<boolean>,
): Promise<Destination | undefined> {
  for (const candidate of candidates) {
    if (candidate && (await exists(candidate.folder))) return candidate;
  }
}

const NEXT_STEP: Record<Destination['kind'], string> = {
  configured: 'It is in the folder set for this tool.',
  app: 'It is in the folder Galaxy Mind Map has open and appears there shortly.',
  downloads:
    'It is in Downloads. To use it in the browser, open Galaxy Mind Map and choose Import.',
};

const IDEA_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'A short idea, a few words.' },
    children: {
      type: 'array',
      description: 'Ideas that belong under this one.',
      items: { $ref: '#/$defs/idea' },
    },
  },
  required: ['text'],
};

/** The tool that turns an outline into a map file, saved by `save`. */
export function createMapTool(
  save: (map: SavedMap) => Promise<{ file: string; destination: Destination }>,
): Tool {
  return {
    name: 'create_mind_map',
    description:
      'Creates a Galaxy Mind Map from a central topic and nested ideas, and saves it as a new file. Keep each idea to a few words; group related ideas under a shared parent.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The central topic.' },
        ideas: {
          type: 'array',
          description: 'The main branches around the central topic.',
          items: { $ref: '#/$defs/idea' },
        },
      },
      required: ['title', 'ideas'],
      $defs: { idea: IDEA_SCHEMA },
    },
    async run({ title, ideas }) {
      const map = mapFromOutline(title, ideas);
      const { file, destination } = await save(map);
      return `Created “${map.root.text}” as ${file} in ${destination.folder}. ${NEXT_STEP[destination.kind]}`;
    },
  };
}
