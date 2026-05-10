const DB_NAME = 'kotangcha_db';
const DB_STORE = 'audio';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = (e: any) => {
      db = e.target.result;
      resolve(db!);
    };
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function dbSet(key: string, value: any): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(DB_STORE, 'readwrite');
    const req = tx.objectStore(DB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function dbGet(key: string): Promise<any> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = (e: any) => resolve(e.target.result || null);
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function dbDelete(key: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(DB_STORE, 'readwrite');
    const req = tx.objectStore(DB_STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export async function dbClear(): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(DB_STORE, 'readwrite');
    const req = tx.objectStore(DB_STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror = (e: any) => reject(e.target.error);
  });
}

export function audioKey(id: number): string {
  return 'audio_' + id;
}
