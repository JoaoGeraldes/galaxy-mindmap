import type { StoredValue } from './folder';

const DATABASE = 'mind-map';
const STORE = 'values';

/**
 * A value kept in IndexedDB, which (unlike localStorage) can hold
 * browser folder handles.
 */
export function indexedDbValue<T>(key: string): StoredValue<T> {
  return {
    load: async () => request<T | undefined>('readonly', (s) => s.get(key)),
    save: async (value) => {
      await request('readwrite', (s) => s.put(value, key));
    },
  };
}

async function request<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const open = indexedDB.open(DATABASE, 1);
  open.onupgradeneeded = () => open.result.createObjectStore(STORE);
  const database = await settled<IDBDatabase>(open);
  const store = database.transaction(STORE, mode).objectStore(STORE);
  return settled<T>(operation(store));
}

function settled<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
