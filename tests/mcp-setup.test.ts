import { describe, expect, it } from 'vitest';
import { claudeConfig } from '../src/lib/mcp-setup';

const INSTALLED = {
  command: 'C:\\Users\\me\\AppData\\Local\\Programs\\app\\Galaxy Mind Map.exe',
  args: ['C:\\Users\\me\\AppData\\Local\\Programs\\app\\server.mjs'],
  env: { ELECTRON_RUN_AS_NODE: '1' },
  ready: true,
};

describe('mcp setup', () => {
  it('writes a settings file Claude can read, naming this app', () => {
    const config = JSON.parse(claudeConfig(INSTALLED));
    expect(Object.keys(config.mcpServers)).toEqual(['galaxy-mind-map']);
    expect(config.mcpServers['galaxy-mind-map'].env).toEqual({
      ELECTRON_RUN_AS_NODE: '1',
    });
  });

  it('writes Windows paths with forward slashes, easier to read', () => {
    const server = JSON.parse(claudeConfig(INSTALLED)).mcpServers[
      'galaxy-mind-map'
    ];
    expect(server.command).toBe(
      'C:/Users/me/AppData/Local/Programs/app/Galaxy Mind Map.exe',
    );
    expect(server.args).toEqual([
      'C:/Users/me/AppData/Local/Programs/app/server.mjs',
    ]);
  });

  it('leaves out env when the server runs on plain Node', () => {
    const config = claudeConfig({
      command: 'node',
      args: ['/home/me/project/build/mcp/server.mjs'],
      ready: true,
    });
    expect(JSON.parse(config).mcpServers['galaxy-mind-map']).toEqual({
      command: 'node',
      args: ['/home/me/project/build/mcp/server.mjs'],
    });
  });
});
