/** A small key-value store kept between visits. */
export interface Store<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  entries(): Promise<[string, T][]>;
}

/** A store that lasts only as long as the page; handy in tests. */
export function memoryStore<T>(initial: Record<string, T> = {}): Store<T> {
  const values = new Map(Object.entries(initial));
  return {
    get: async (key) => values.get(key),
    set: async (key, value) => void values.set(key, value),
    delete: async (key) => void values.delete(key),
    entries: async () => [...values],
  };
}

/** A store in its own IndexedDB database, which survives reloads. */
export function indexedDbStore<T>(database: string): Store<T> {
  const ENTRIES = 'entries';

  async function run<R>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest,
  ): Promise<R> {
    const open = indexedDB.open(database, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(ENTRIES);
    const db = await settled<IDBDatabase>(open);
    try {
      return await settled<R>(
        operation(db.transaction(ENTRIES, mode).objectStore(ENTRIES)),
      );
    } finally {
      db.close();
    }
  }

  return {
    get: (key) => run('readonly', (store) => store.get(key)),
    set: (key, value) => run('readwrite', (store) => store.put(value, key)),
    delete: (key) => run('readwrite', (store) => store.delete(key)),
    async entries() {
      const [keys, values] = await Promise.all([
        run<IDBValidKey[]>('readonly', (store) => store.getAllKeys()),
        run<T[]>('readonly', (store) => store.getAll()),
      ]);
      return keys.map((key, i) => [String(key), values[i]]);
    },
  };
}

function settled<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
