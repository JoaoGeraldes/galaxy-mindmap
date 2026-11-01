/** Earlier and later versions of something, for undo and redo. */
export interface History<T> {
  past: T[];
  future: T[];
}

export function emptyHistory<T>(): History<T> {
  return { past: [], future: [] };
}

/** Where an undo or redo lands: the new history and the version to show. */
export interface Step<T> {
  history: History<T>;
  state: T;
}

/** Remembers the version before a change. A new change clears redo. */
export function record<T>(
  history: History<T>,
  before: T,
  limit: number,
): History<T> {
  return { past: [...history.past, before].slice(-limit), future: [] };
}

/** Steps back one version, keeping `current` so it can be redone. */
export function undo<T>(history: History<T>, current: T): Step<T> | undefined {
  if (!history.past.length) return;
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
    state: history.past[history.past.length - 1],
  };
}

/** Steps forward again after an undo. */
export function redo<T>(history: History<T>, current: T): Step<T> | undefined {
  if (!history.future.length) return;
  return {
    history: {
      past: [...history.past, current],
      future: history.future.slice(1),
    },
    state: history.future[0],
  };
}
