const DB_NAME = 'mymeds-db';
const DB_VERSION = 2;
let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('scripts')) {
        d.createObjectStore('scripts', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('doses')) {
        d.createObjectStore('doses', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('collections')) {
        d.createObjectStore('collections', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('settings')) {
        d.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function getAll(store) {
  return new Promise((res, rej) => {
    const req = tx(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function put(store, item) {
  return new Promise((res, rej) => {
    const req = tx(store, 'readwrite').put(item);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

function del(store, id) {
  return new Promise((res, rej) => {
    const req = tx(store, 'readwrite').delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

// SCRIPTS
export const getScripts = () => getAll('scripts');
export const saveScript = s => put('scripts', s);
export const deleteScript = id => del('scripts', id);

// DOSES
export const getDoses = () => getAll('doses');
export const saveDose = d => put('doses', d);

// COLLECTIONS
export const getCollections = () => getAll('collections');
export const saveCollection = c => put('collections', c);

// SETTINGS
export function getSetting(key) {
  return new Promise((res, rej) => {
    const req = tx('settings').get(key);
    req.onsuccess = () => res(req.result ? req.result.value : null);
    req.onerror = () => rej(req.error);
  });
}
export function setSetting(key, value) {
  return put('settings', { key, value });
}
