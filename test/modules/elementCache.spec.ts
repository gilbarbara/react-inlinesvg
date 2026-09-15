import { createElement, ReactElement } from 'react';

import { ELEMENT_CACHE_MAX_SIZE } from '../../src/config';
import {
  clearElementCache,
  getCachedElement,
  getElementCacheSize,
  setCachedElement,
} from '../../src/modules/elementCache';

function element(name: string): ReactElement {
  return createElement('svg', { id: name });
}

function fill(count: number, prefix = 'key') {
  for (let index = 0; index < count; index++) {
    setCachedElement(`${prefix}-${index}`, element(`${prefix}-${index}`));
  }
}

describe('elementCache', () => {
  beforeEach(() => {
    clearElementCache();
  });

  describe('get/set', () => {
    it('should return undefined for an unknown key', () => {
      expect(getCachedElement('nope')).toBeUndefined();
      expect(getElementCacheSize()).toBe(0);
    });

    it('should return the element that was stored', () => {
      const circle = element('circle');

      setCachedElement('circle', circle);

      expect(getCachedElement('circle')).toBe(circle);
      expect(getElementCacheSize()).toBe(1);
    });

    it('should replace the element stored for a key', () => {
      setCachedElement('circle', element('first'));
      setCachedElement('circle', element('second'));

      expect(getCachedElement('circle')).toHaveProperty('props.id', 'second');
      expect(getElementCacheSize()).toBe(1);
    });
  });

  describe('clearElementCache', () => {
    it('should drop every entry', () => {
      setCachedElement('circle', element('circle'));
      setCachedElement('rect', element('rect'));

      clearElementCache();

      expect(getElementCacheSize()).toBe(0);
      expect(getCachedElement('circle')).toBeUndefined();
    });
  });

  describe('eviction', () => {
    it('should not evict anything below the limit', () => {
      fill(ELEMENT_CACHE_MAX_SIZE);

      expect(getElementCacheSize()).toBe(ELEMENT_CACHE_MAX_SIZE);
      expect(getCachedElement('key-0')).toBeDefined();
    });

    it('should evict the oldest entry once the limit is passed', () => {
      fill(ELEMENT_CACHE_MAX_SIZE + 1);

      expect(getElementCacheSize()).toBe(ELEMENT_CACHE_MAX_SIZE);
      expect(getCachedElement('key-0')).toBeUndefined();
      expect(getCachedElement('key-1')).toBeDefined();
      expect(getCachedElement(`key-${ELEMENT_CACHE_MAX_SIZE}`)).toBeDefined();
    });

    it('should keep an entry that was read recently', () => {
      fill(ELEMENT_CACHE_MAX_SIZE);

      // key-0 is the oldest, so reading it has to make key-1 the next one evicted.
      expect(getCachedElement('key-0')).toBeDefined();

      setCachedElement('extra', element('extra'));

      expect(getCachedElement('key-0')).toBeDefined();
      expect(getCachedElement('key-1')).toBeUndefined();
      expect(getElementCacheSize()).toBe(ELEMENT_CACHE_MAX_SIZE);
    });

    it('should not evict anything when an existing key is written again', () => {
      fill(ELEMENT_CACHE_MAX_SIZE);
      setCachedElement('key-0', element('updated'));

      expect(getElementCacheSize()).toBe(ELEMENT_CACHE_MAX_SIZE);
      expect(getCachedElement('key-0')).toHaveProperty('props.id', 'updated');
      expect(getCachedElement('key-1')).toBeDefined();
    });

    it('should keep an entry that was written again', () => {
      fill(ELEMENT_CACHE_MAX_SIZE);
      // key-0 is the oldest, so writing it again has to make key-1 the next one evicted.
      setCachedElement('key-0', element('updated'));

      setCachedElement('extra', element('extra'));

      expect(getCachedElement('key-0')).toHaveProperty('props.id', 'updated');
      expect(getCachedElement('key-1')).toBeUndefined();
      expect(getElementCacheSize()).toBe(ELEMENT_CACHE_MAX_SIZE);
    });
  });
});
