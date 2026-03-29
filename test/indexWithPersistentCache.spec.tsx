import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import CacheMock from 'browser-cache-mock';
import createFetchMock from 'vitest-fetch-mock';

import ReactInlineSVG from '../src/index';
import CacheProvider from '../src/provider';

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
    await cacheMock.keys().then(keys => Promise.all(keys.map(key => cacheMock.delete(key))));
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

    const cached = await cacheMock.match(url);

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
});
