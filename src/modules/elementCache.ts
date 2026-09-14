import { ReactElement } from 'react';

import { ELEMENT_CACHE_MAX_SIZE } from '../config';

const store = new Map<string, ReactElement>();

export function clearElementCache() {
  store.clear();
}

export function getCachedElement(key: string): ReactElement | undefined {
  const element = store.get(key);

  if (element) {
    // Re-insert so the least recently used entry is always the next one evicted.
    store.delete(key);
    store.set(key, element);
  }

  return element;
}

export function getElementCacheKey(parts: Array<boolean | string | null | undefined>): string {
  return JSON.stringify(parts);
}

export function getElementCacheSize(): number {
  return store.size;
}

export function setCachedElement(key: string, element: ReactElement) {
  store.delete(key);
  store.set(key, element);

  if (store.size > ELEMENT_CACHE_MAX_SIZE) {
    const oldest = store.keys().next().value;

    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
}
