import type { SavedMap } from './projects';
import { createNode, type MindNode } from './tree';

/** An idea as an AI or another tool describes it: text, and ideas under it. */
export interface OutlineIdea {
  text: string;
  children?: OutlineIdea[];
}

/** Keeps generated maps a size people can actually read. */
export const OUTLINE_LIMITS = { ideas: 500, depth: 8, textLength: 200 };

/**
 * Builds a map from a title and nested ideas. Anything malformed is
 * rejected with a message saying how to fix it, so an AI can try again.
 */
export function mapFromOutline(
  title: unknown,
  ideas: unknown,
  now = new Date(),
): SavedMap {
  const { ideas: maxIdeas, depth: maxDepth, textLength } = OUTLINE_LIMITS;
  let count = 0;

  const label = (value: unknown, what: string) => {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${what} needs some text.`);
    }
    const text = value.trim();
    if (text.length > textLength) {
      throw new Error(`${what} is over ${textLength} characters: “${text}”.`);
    }
    return text;
  };

  const branch = (items: unknown, depth: number): MindNode[] => {
    if (items === undefined) return [];
    if (!Array.isArray(items)) throw new Error('Ideas must be given as lists.');
    if (items.length && depth > maxDepth) {
      throw new Error(`Ideas can be nested at most ${maxDepth} levels deep.`);
    }
    return items.map((item) => {
      if (++count > maxIdeas) {
        throw new Error(`A map can hold at most ${maxIdeas} ideas.`);
      }
      const { text, children } = (item ?? {}) as Record<string, unknown>;
      const node = createNode(label(text, 'Every idea'));
      node.children = branch(children, depth + 1);
      return node;
    });
  };

  const root = createNode(label(title, 'The title'));
  root.children = branch(ideas, 1);
  const time = now.toISOString();
  return { createdAt: time, updatedAt: time, root };
}
