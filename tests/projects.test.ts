import { describe, expect, it } from 'vitest';
import {
  byTitle,
  exportFileName,
  fileNameFor,
  loadProjects,
  parseMap,
  serializeMap,
  slugify,
} from '../src/lib/projects';
import { addChild, createNode } from '../src/lib/tree';

const CREATED = '2026-01-02T10:00:00.000Z';
const UPDATED = '2026-03-04T12:30:00.000Z';
const MODIFIED = '2026-05-06T08:15:00.000Z';

function sampleMap(title = 'Ideas') {
  const root = createNode(title);
  addChild(root, root.id, 'First idea');
  return { createdAt: CREATED, updatedAt: UPDATED, root };
}

describe('projects', () => {
  it('reads back a saved map unchanged, timestamps included', () => {
    const map = sampleMap();
    expect(parseMap(serializeMap(map))).toEqual(map);
  });

  it('stores the creation and update times in the file', () => {
    const data = JSON.parse(serializeMap(sampleMap()));
    expect(data.createdAt).toBe(CREATED);
    expect(data.updatedAt).toBe(UPDATED);
  });

  it('gives files saved without timestamps the fallback time', () => {
    const oldFile = JSON.stringify({ version: 1, root: createNode('Old') });
    const map = parseMap(oldFile, MODIFIED);
    expect(map.createdAt).toBe(MODIFIED);
    expect(map.updatedAt).toBe(MODIFIED);
  });

  it('ignores timestamps that are not valid dates', () => {
    const text = JSON.stringify({
      createdAt: 'yesterday-ish',
      updatedAt: 42,
      root: createNode('Odd'),
    });
    expect(parseMap(text, MODIFIED).createdAt).toBe(MODIFIED);
    expect(parseMap(text, MODIFIED).updatedAt).toBe(MODIFIED);
  });

  it('rejects a file that is not valid JSON', () => {
    expect(() => parseMap('{ nope')).toThrow('This file is not valid JSON.');
  });

  it('rejects JSON that does not contain a mind map', () => {
    expect(() => parseMap('{"root": {"text": 1}}')).toThrow(
      'This file does not contain a mind map.',
    );
    expect(() => parseMap('null')).toThrow(
      'This file does not contain a mind map.',
    );
  });

  it('loads every readable file and lists the unreadable ones', () => {
    const { projects, unreadable } = loadProjects([
      {
        file: 'Ideas.json',
        text: serializeMap(sampleMap()),
        modifiedAt: MODIFIED,
      },
      { file: 'notes.json', text: '{ broken', modifiedAt: MODIFIED },
    ]);
    expect(projects).toHaveLength(1);
    expect(projects[0].file).toBe('Ideas.json');
    expect(projects[0].root.text).toBe('Ideas');
    expect(projects[0].createdAt).toBe(CREATED);
    expect(unreadable).toEqual(['notes.json']);
  });

  it('sorts maps by title, ignoring case', () => {
    const { projects } = loadProjects(
      ['beta', 'Gamma', 'alpha'].map((title) => ({
        file: `${title}.json`,
        text: serializeMap(sampleMap(title)),
        modifiedAt: MODIFIED,
      })),
    );
    const titles = projects.sort(byTitle).map((p) => p.root.text);
    expect(titles).toEqual(['alpha', 'beta', 'Gamma']);
  });

  it('names a file after the map title, with dashes for spaces', () => {
    expect(fileNameFor('Holiday plans', [])).toBe('holiday-plans.json');
  });

  it('turns accented letters into plain English ones', () => {
    expect(slugify('Ação à vista, coração')).toBe('acao-a-vista-coracao');
    expect(slugify('Straße, Æsir, Øresund, Łódź')).toBe(
      'strasse-aesir-oresund-lodz',
    );
  });

  it('turns punctuation into single dashes, never at either end', () => {
    expect(slugify('  Q1: plans / goals?! ')).toBe('q1-plans-goals');
  });

  it('keeps file names reasonably short', () => {
    const name = slugify('word '.repeat(40));
    expect(name.length).toBeLessThanOrEqual(60);
    expect(name.endsWith('-')).toBe(false);
  });

  it('falls back to untitled when nothing usable is left', () => {
    expect(fileNameFor(' ?* ', [])).toBe('untitled.json');
    expect(fileNameFor('日本語', [])).toBe('untitled.json');
  });

  it('numbers the name when it is already taken, ignoring case', () => {
    const taken = ['ideas.json', 'Ideas-2.json'];
    expect(fileNameFor('Ideas', taken)).toBe('ideas-3.json');
  });

  it('stamps exported copies with the date and time in the locale order', () => {
    const when = new Date('2026-11-01T15:28:00Z');
    const at = (locale: string) =>
      exportFileName('ideas.json', when, { locale, timeZone: 'UTC' });
    expect(at('pt-PT')).toBe('ideas-01-11-2026-15-28.json');
    expect(at('en-US')).toBe('ideas-11-01-2026-15-28.json');
    expect(at('ja-JP')).toBe('ideas-2026-11-01-15-28.json');
  });

  it('keeps afternoon times apart from morning ones in every locale', () => {
    const at = (time: string) =>
      exportFileName('ideas.json', new Date(`2026-11-01T${time}Z`), {
        locale: 'ko-KR',
        timeZone: 'UTC',
      });
    expect(at('03:28:00')).not.toBe(at('15:28:00'));
    expect(at('15:28:00')).toContain('15-28');
  });
});
