/* eslint-disable import/first */
import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import CacheMock from 'browser-cache-mock';
import createFetchMock from 'vitest-fetch-mock';

const fetchMock = createFetchMock(vi);

const cacheMock = new CacheMock();

Object.defineProperty(window, 'caches', {
  value: {
    ...window.caches,
    open: async () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(cacheMock);
        }, 500);
      }),
    ...cacheMock,
  },
});

import ReactInlineSVG, { cacheStore, Props } from '../src/index';
import CacheProvider from '../src/provider';

function Loader() {
  return <div data-testid="Loader" />;
}

const mockOnError = vi.fn();
const mockOnLoad = vi.fn();

const url = 'https://cdn.svgporn.com/logos/react.svg';

fetchMock.enableMocks();

fetchMock.mockResponse(() =>
  Promise.resolve({
    body: '<svg><title>React</title><circle /></svg>',
    headers: { 'Content-Type': 'image/svg+xml' },
  }),
);

function setup({ cacheName, onLoad, ...rest }: Props & { cacheName?: string }) {
  return render(
    <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} {...rest} />,
    { wrapper: ({ children }) => <CacheProvider name={cacheName}>{children}</CacheProvider> },
  );
}

describe('react-inlinesvg (with persistent cache)', () => {
  afterEach(async () => {
    fetchMock.mockClear();
    await cacheStore.clear();
  });

  it('should set the default global variables', () => {
    setup({ src: url });

    expect(window.REACT_INLINESVG_PERSISTENT_CACHE).toBeTrue();
    expect(window.REACT_INLINESVG_CACHE_NAME).toBeUndefined();
  });

  it('should set the cache name global variable', () => {
    setup({ cacheName: 'test-cache', src: url });

    expect(window.REACT_INLINESVG_CACHE_NAME).toBe('test-cache');
  });

  it('should request an SVG only once', async () => {
    setup({ src: url });

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(1, url, true);
    });

    setup({ src: url });

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(2, url, true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cacheStore.isCached(url)).toBeTrue();
  });

  it('should handle multiple simultaneous instances with the same url', async () => {
    render(
      <>
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
        <ReactInlineSVG onLoad={mockOnLoad} src={url} />
      </>,
    );

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(3, url, true);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setup({ src: url });

    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenNthCalledWith(4, url, true);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
