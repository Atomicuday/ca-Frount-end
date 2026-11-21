/**
 * ZapDocs Centralized Storage Utility for CA Portal
 * Safe JSON read, write, remove, and scoped clearing with in-memory fallback.
 */

const memoryStorage = new Map();

function isStorageAvailable() {
  try {
    const testKey = '__zd_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = typeof window !== 'undefined' && isStorageAvailable();

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      let raw = null;
      if (hasLocalStorage) {
        raw = window.localStorage.getItem(key);
      } else {
        raw = memoryStorage.get(key) ?? null;
      }

      if (raw === null || raw === undefined) {
        return defaultValue;
      }

      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch (err) {
      console.warn(`[Storage] Failed to read key "${key}":`, err);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      if (value === undefined) {
        storage.remove(key);
        return true;
      }

      const serialized = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);

      if (hasLocalStorage) {
        window.localStorage.setItem(key, serialized);
      } else {
        memoryStorage.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`[Storage] Failed to set key "${key}":`, err);
      return false;
    }
  },

  remove: (key) => {
    try {
      if (hasLocalStorage) {
        window.localStorage.removeItem(key);
      } else {
        memoryStorage.delete(key);
      }
    } catch (err) {
      console.warn(`[Storage] Failed to remove key "${key}":`, err);
    }
  },

  clear: () => {
    try {
      if (hasLocalStorage) {
        window.localStorage.clear();
      } else {
        memoryStorage.clear();
      }
    } catch (err) {
      console.warn('[Storage] Failed to clear storage:', err);
    }
  }
};

export default storage;
