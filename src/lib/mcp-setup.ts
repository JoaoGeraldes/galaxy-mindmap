/** How an AI app should start this app's MCP server, as the app reports it. */
export interface McpSetup {
  command: string;
  args: string[];
  env?: Record<string, string>;
  /** False when the server hasn't been built yet (only when developing). */
  ready: boolean;
}

export const SERVER_NAME = 'galaxy-mind-map';

/**
 * Claude Desktop's settings file with this app's server, ready to paste.
 * Paths use forward slashes, which Windows accepts and people read easily.
 */
export function claudeConfig({ command, args, env }: McpSetup): string {
  const slashes = (text: string) => text.replace(/\\/g, '/');
  const server = {
    command: slashes(command),
    args: args.map(slashes),
    ...(env && { env }),
  };
  return JSON.stringify({ mcpServers: { [SERVER_NAME]: server } }, null, 2);
}
