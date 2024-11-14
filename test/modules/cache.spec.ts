import { waitFor } from '@testing-library/react';
import CacheMock from 'browser-cache-mock';
import createFetchMock from 'vitest-fetch-mock';

import { STATUS } from '../../src/config';
import CacheStore from '../../src/modules/cache';

const fetchMock = createFetchMock(vi);

fetchMock.enableMocks();

const cacheMock = new CacheMock();

let cachesOpenPromise = new Promise(resolve => {
  setTimeout(() => {
    resolve(cacheMock);
  }, 500);
});

Object.defineProperty(window, 'caches', {
  value: {
    ...window.caches,
    open: async () => cachesOpenPromise,
    ...cacheMock,
  },
});

const reactUrl = 'https://cdn.svgporn.com/logos/react.svg';
const reactContent = '<svg><title>React</title><circle /></svg>';
const jsUrl = 'https://cdn.svgporn.com/logos/javascript.svg';
const jsContent = '<svg><title>JS</title><circle /></svg>';

describe('CacheStore (internal)', () => {
  const cacheStore = new CacheStore();

  afterEach(async () => {
    fetchMock.mockClear();
    await cacheStore.clear();
  });

  it('should fetch the remote url and add to the cache', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(reactContent));

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cacheStore.isCached(reactUrl)).toBeTrue();

    await cacheStore.clear();
    expect(cacheStore.isCached(reactUrl)).toBeFalse();
  });

  it('should handle multiple simultaneous requests', async () => {
    fetchMock.mockResponse(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(reactContent);
        }, 300);
      });
    });

    expect(cacheStore.get(reactUrl)).toEqual(expect.any(Promise));

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cacheStore.isCached(reactUrl)).toBeTrue();
  });

  it('should handle adding to cache manually', async () => {
    cacheStore.set(jsUrl, { content: jsContent, status: STATUS.LOADED });

    await expect(cacheStore.get(jsUrl)).resolves.toBe(jsContent);
    expect(fetchMock).toHaveBeenCalledTimes(0);

    expect(cacheStore.isCached(jsUrl)).toBeTrue();
    expect(cacheStore.keys()).toEqual([jsUrl]);
  });

  it(`should handle stalled entries with ${STATUS.LOADING}`, async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(jsContent));

    cacheStore.set(jsUrl, { content: jsContent, status: STATUS.LOADING });
    expect(fetchMock).toHaveBeenCalledTimes(0);

    await expect(cacheStore.get(jsUrl)).resolves.toBe(jsContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to fetch'));

    await expect(cacheStore.get(jsUrl)).rejects.toThrow('Failed to fetch');
    expect(cacheStore.isCached(jsUrl)).toBeFalse();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should return the cached keys', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(reactContent));

    await cacheStore.get(reactUrl);

    expect(cacheStore.keys()).toEqual([reactUrl]);
  });

  it('should return the cached data', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(reactContent));

    await cacheStore.get(reactUrl);

    expect(cacheStore.data()).toEqual([
      {
        [reactUrl]: { content: reactContent, status: STATUS.LOADED },
      },
    ]);
  });

  it('should delete an item from the cache', async () => {
    await cacheStore.get(reactUrl);
    expect(cacheStore.keys()).toHaveLength(1);

    await cacheStore.delete(reactUrl);
    expect(cacheStore.keys()).toHaveLength(0);
  });

  it('should clear the cache items', async () => {
    await cacheStore.get(reactUrl);
    expect(cacheStore.keys()).toHaveLength(1);

    await cacheStore.clear();
    expect(cacheStore.keys()).toHaveLength(0);
  });
});

describe('CacheStore (external)', () => {
  Object.defineProperty(window, 'REACT_INLINESVG_PERSISTENT_CACHE', {
    value: true,
  });
  const mockReady = vi.fn();
  const cacheStore = new CacheStore();

  // wait for the cache to be ready
  cacheStore.onReady(mockReady);

  beforeEach(() => {
    fetchMock.mockResponse(() => Promise.resolve(reactContent));
  });

  afterEach(async () => {
    fetchMock.mockClear();
    await cacheStore.clear();
  });

  it('should handle initialization', async () => {
    await waitFor(() => {
      expect(mockReady).toHaveBeenCalledTimes(1);
    });

    cacheStore.onReady(mockReady);
    expect(mockReady).toHaveBeenCalledTimes(2);
  });

  it('should fetch the remote url and add to the cache', async () => {
    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(cacheStore.isCached(reactUrl)).toBeTrue();
    expect(cacheStore.keys()).toEqual([reactUrl]);
  });

  it('should handle multiple simultaneous requests', async () => {
    fetchMock.mockResponse(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(reactContent);
        }, 300);
      });
    });

    expect(cacheStore.get(reactUrl)).toEqual(expect.any(Promise));

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should read from the persistent cache if the store is empty', async () => {
    // add to the persistent cache directly
    await cacheMock.add(reactUrl);
    fetchMock.mockClear();

    await expect(cacheStore.get(reactUrl)).resolves.toBe(reactContent);
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it('should handle delete', async () => {
    await cacheStore.get(reactUrl);

    await cacheStore.delete(reactUrl);

    expect(cacheStore.keys()).toHaveLength(0);
    await expect(cacheMock.keys()).resolves.toHaveLength(0);
  });

  it('should handle clear', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(reactContent));

    await cacheStore.get(reactUrl);

    await cacheStore.clear();

    expect(cacheStore.keys()).toHaveLength(0);
    await expect(cacheMock.keys()).resolves.toHaveLength(0);
  });

  it(`should handle stalled entries with ${STATUS.LOADING}`, async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(jsContent));

    cacheStore.set(jsUrl, { content: jsContent, status: STATUS.LOADING });
    expect(fetchMock).toHaveBeenCalledTimes(0);

    await expect(cacheStore.get(jsUrl)).resolves.toBe(jsContent);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch errors', async () => {
    fetchMock.mockRejectOnce(new Error('Failed to fetch'));

    await expect(cacheStore.get(jsUrl)).rejects.toThrow('Failed to fetch');
    expect(cacheStore.isCached(jsUrl)).toBeFalse();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should handle caches.open errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockReady.mockClear();
    cachesOpenPromise = Promise.reject(new Error('The operation is insecure.'));

    const cacheStoreWithError = new CacheStore();

    cacheStoreWithError.onReady(mockReady);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to open cache: The operation is insecure.');
    });
    expect(mockReady).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
