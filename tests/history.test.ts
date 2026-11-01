import { describe, expect, it } from 'vitest';
import { emptyHistory, record, redo, undo } from '../src/lib/history';

describe('history', () => {
  it('has nothing to undo or redo at first', () => {
    expect(undo(emptyHistory<string>(), 'now')).toBeUndefined();
    expect(redo(emptyHistory<string>(), 'now')).toBeUndefined();
  });

  it('undoes back to the version before a change', () => {
    const history = record(emptyHistory<string>(), 'before', 10);
    expect(undo(history, 'after')?.state).toBe('before');
  });

  it('redoes what was just undone', () => {
    const undone = undo(record(emptyHistory<string>(), 'before', 10), 'after')!;
    expect(redo(undone.history, undone.state)?.state).toBe('after');
  });

  it('undoes several changes in reverse order', () => {
    let history = record(emptyHistory<string>(), 'one', 10);
    history = record(history, 'two', 10);
    const first = undo(history, 'three')!;
    const second = undo(first.history, first.state)!;
    expect([first.state, second.state]).toEqual(['two', 'one']);
  });

  it('forgets the redo trail once a new change is made', () => {
    const undone = undo(record(emptyHistory<string>(), 'before', 10), 'after')!;
    const changed = record(undone.history, undone.state, 10);
    expect(redo(changed, 'other')).toBeUndefined();
  });

  it('keeps only the most recent versions', () => {
    let history = emptyHistory<string>();
    for (const version of ['a', 'b', 'c', 'd']) {
      history = record(history, version, 3);
    }
    expect(history.past).toEqual(['b', 'c', 'd']);
  });
});
