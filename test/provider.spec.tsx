import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import CacheMock from 'browser-cache-mock';
import createFetchMock from 'vitest-fetch-mock';

import { CACHE_NAME } from '../src/config';
import ReactInlineSVG, { cacheStore as singletonCache } from '../src/index';
import CacheProvider from '../src/provider';

const fetchMock = createFetchMock(vi);

const cacheMocks = new Map<string, CacheMock>();

function getCacheMock(name: string): CacheMock {
  let cache = cacheMocks.get(name);

  if (!cache) {
    cache = new CacheMock();
    cacheMocks.set(name, cache);
  }

  return cache;
}

Object.defineProperty(window, 'caches', {
  value: {
    open: async (name: string) =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(getCacheMock(name));
        }, 500);
      }),
  },
});

function Loader() {
  return <div data-testid="Loader" />;
}

const mockOnError = vi.fn();
const mockOnLoad = vi.fn();

const url = 'https://cdn.svglogos.dev/logos/react.svg';

fetchMock.enableMocks();

fetchMock.mockResponse(() =>
  Promise.resolve({
    body: '<svg><title>React</title><circle /></svg>',
    headers: { 'Content-Type': 'image/svg+xml' },
  }),
);

describe('react-inlinesvg (with persistent cache)', () => {
  afterEach(async () => {
    fetchMock.mockClear();
    mockOnLoad.mockClear();
    mockOnError.mockClear();

    await Promise.all(
      [...cacheMocks.values()].map(async cache => {
        const keys = await cache.keys();

        await Promise.all(keys.map(key => cache.delete(key)));
      }),
    );

    await singletonCache.clear();
  });

  it('should request an SVG only once', async () => {
    const { rerender } = render(
      <CacheProvider>
        <ReactInlineSVG
          key="first"
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={url}
        />
      </CacheProvider>,
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(1, url, false);
    });

    rerender(
      <CacheProvider>
        <ReactInlineSVG
          key="second"
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={url}
        />
      </CacheProvider>,
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(2, url, true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should persist SVG in the Cache API', async () => {
    render(
      <CacheProvider>
        <ReactInlineSVG loader={<Loader />} onLoad={mockOnLoad} src={url} />
      </CacheProvider>,
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalledTimes(1);
    });

    const cached = await getCacheMock(CACHE_NAME).match(url);

    expect(cached).not.toBeUndefined();
  });

  it('should handle multiple simultaneous instances with the same url', async () => {
    render(
      <CacheProvider>
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
      </CacheProvider>,
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(3, url, false);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should isolate provider cache from singleton cache', async () => {
    const onLoadProvider = vi.fn();
    const onLoadSingleton = vi.fn();

    render(
      <>
        <CacheProvider>
          <ReactInlineSVG loader={<Loader />} onLoad={onLoadProvider} src={url} />
        </CacheProvider>
        <ReactInlineSVG loader={<Loader />} onLoad={onLoadSingleton} src={url} />
      </>,
    );

    await waitFor(() => {
      expect(onLoadProvider).toHaveBeenCalledTimes(1);
      expect(onLoadSingleton).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(getCacheMock(CACHE_NAME).match(url)).resolves.not.toBeUndefined();
    expect(singletonCache.isCached(url)).toBe(true);
  });

  it('should isolate caches between providers with different names', async () => {
    const onLoadA = vi.fn();
    const onLoadB = vi.fn();

    render(
      <>
        <CacheProvider name="bucket-a">
          <ReactInlineSVG loader={<Loader />} onLoad={onLoadA} src={url} />
        </CacheProvider>
        <CacheProvider name="bucket-b">
          <ReactInlineSVG loader={<Loader />} onLoad={onLoadB} src={url} />
        </CacheProvider>
      </>,
    );

    await waitFor(() => {
      expect(onLoadA).toHaveBeenCalledTimes(1);
      expect(onLoadB).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(getCacheMock('bucket-a').match(url)).resolves.not.toBeUndefined();
    await expect(getCacheMock('bucket-b').match(url)).resolves.not.toBeUndefined();
  });
});
