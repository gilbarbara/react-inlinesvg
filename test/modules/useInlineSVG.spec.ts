import { act, renderHook, waitFor } from '@testing-library/react';
import createFetchMock from 'vitest-fetch-mock';

import type { Props } from '../../src';
import { STATUS } from '../../src/config';
import CacheStore from '../../src/modules/cache';
import useInlineSVG from '../../src/modules/useInlineSVG';

const fetchMock = createFetchMock(vi);

fetchMock.enableMocks();

const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><circle /></svg>';
const svgContentAlt = '<svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>';
const base64Src = `data:image/svg+xml;base64,${btoa(svgContent)}`;
const urlEncodedSrc = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;

function defaultProps(overrides: Partial<Props> = {}): Props {
  return {
    src: 'https://example.com/icon.svg',
    ...overrides,
  };
}

describe('useInlineSVG', () => {
  let cacheStore: CacheStore;

  beforeEach(() => {
    cacheStore = new CacheStore();
    fetchMock.mockResponse(() => Promise.resolve(svgContent));
  });

  afterEach(() => {
    fetchMock.mockClear();
    cacheStore.clear();
  });

  describe('initial state', () => {
    it('should return idle status for uncached src', async () => {
      const { result, unmount } = renderHook(() => useInlineSVG(defaultProps(), cacheStore));

      expect(result.current.element).toBeNull();
      // After mount, it transitions to LOADING
      expect(result.current.status).toBe(STATUS.LOADING);

      unmount();
    });

    it('should return ready status when cacheStore has content', async () => {
      cacheStore.set('https://example.com/icon.svg', {
        content: svgContent,
        status: STATUS.LOADED,
      });

      const { result } = renderHook(() => useInlineSVG(defaultProps(), cacheStore));

      expect(result.current.status).toBe(STATUS.READY);
      expect(result.current.element).not.toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should transition LOADING -> LOADED -> READY for remote URL', async () => {
      const onLoad = vi.fn();
      const { result } = renderHook(() => useInlineSVG(defaultProps({ onLoad }), cacheStore));

      expect(result.current.status).toBe(STATUS.LOADING);

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(result.current.element).not.toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledWith('https://example.com/icon.svg', false);
    });

    it('should handle inline SVG string without fetching', async () => {
      const onLoad = vi.fn();
      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ src: svgContent, onLoad }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(result.current.element).not.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalledWith(svgContent, false);
    });

    it('should handle base64 data URI', async () => {
      const onLoad = vi.fn();
      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ src: base64Src, onLoad }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(result.current.element).not.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalledWith(base64Src, false);
    });

    it('should handle URL-encoded data URI', async () => {
      const onLoad = vi.fn();
      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ src: urlEncodedSrc, onLoad }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(result.current.element).not.toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalledWith(urlEncodedSrc, false);
    });
  });

  describe('error handling', () => {
    it('should fail with "Missing src" when src is empty', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ src: '' as unknown as string, onError }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.FAILED);
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing src' }));
    });

    it('should fail on fetch error', async () => {
      fetchMock.mockRejectOnce(new Error('Network error'));

      const onError = vi.fn();
      const { result } = renderHook(() => useInlineSVG(defaultProps({ onError }), cacheStore));

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.FAILED);
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Network error' }));
    });
  });

  describe('src changes', () => {
    it('should re-fetch when src changes', async () => {
      const onLoad = vi.fn();
      const props = defaultProps({ onLoad });
      const { rerender, result } = renderHook(({ p }) => useInlineSVG(p, cacheStore), {
        initialProps: { p: props },
      });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(onLoad).toHaveBeenCalledWith('https://example.com/icon.svg', false);
      fetchMock.mockClear();
      onLoad.mockClear();
      fetchMock.mockResponse(() => Promise.resolve(svgContentAlt));

      rerender({ p: { ...props, src: 'https://example.com/icon2.svg' } });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledWith('https://example.com/icon2.svg', false);
    });

    it('should error when src changes to empty', async () => {
      const onError = vi.fn();
      const props = defaultProps({ onError });
      const { rerender, result } = renderHook(({ p }) => useInlineSVG(p, cacheStore), {
        initialProps: { p: props },
      });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      onError.mockClear();

      rerender({ p: { ...props, src: '' } });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.FAILED);
      });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing src' }));
    });
  });

  describe('abort behavior', () => {
    it('should abort in-flight request on unmount', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

      fetchMock.mockResponse(
        () => new Promise(resolve => setTimeout(() => resolve(svgContent), 5000)),
      );

      const { unmount } = renderHook(() => useInlineSVG(defaultProps(), cacheStore));

      // Let the LOADING effect fire
      await act(async () => {
        await Promise.resolve();
      });

      unmount();

      expect(abortSpy).toHaveBeenCalled();
      abortSpy.mockRestore();
    });

    it('should abort previous request on src change', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

      fetchMock.mockResponse(
        () => new Promise(resolve => setTimeout(() => resolve(svgContent), 5000)),
      );

      const props = defaultProps();
      const { rerender } = renderHook(({ p }) => useInlineSVG(p, cacheStore), {
        initialProps: { p: props },
      });

      // Let the LOADING effect fire
      await act(async () => {
        await Promise.resolve();
      });

      rerender({ p: { ...props, src: 'https://example.com/icon2.svg' } });

      expect(abortSpy).toHaveBeenCalled();
      abortSpy.mockRestore();
    });
  });

  describe('cacheRequests option', () => {
    it('should bypass cacheStore when cacheRequests is false', async () => {
      const getSpy = vi.spyOn(cacheStore, 'get');
      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ cacheRequests: false }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(getSpy).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      getSpy.mockRestore();
    });

    it('should use cacheStore when cacheRequests is true (default)', async () => {
      const getSpy = vi.spyOn(cacheStore, 'get');
      const { result } = renderHook(() => useInlineSVG(defaultProps(), cacheStore));

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(getSpy).toHaveBeenCalledTimes(1);
      getSpy.mockRestore();
    });
  });

  describe('onLoad callback', () => {
    it('should call onLoad with isCached=true for cached entries', async () => {
      // Pre-populate cache via fetch
      await cacheStore.get('https://example.com/icon.svg');
      fetchMock.mockClear();

      const onLoad = vi.fn();
      const { result } = renderHook(() => useInlineSVG(defaultProps({ onLoad }), cacheStore));

      // Cached initializer should skip to READY
      expect(result.current.status).toBe(STATUS.READY);
      expect(onLoad).toHaveBeenCalledWith('https://example.com/icon.svg', true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should call onLoad with isCached=false for fresh fetches', async () => {
      const onLoad = vi.fn();
      const { result } = renderHook(() => useInlineSVG(defaultProps({ onLoad }), cacheStore));

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(onLoad).toHaveBeenCalledWith('https://example.com/icon.svg', false);
    });
  });

  describe('title and description changes', () => {
    it('should re-render element when title changes without re-fetching', async () => {
      const props = defaultProps({ title: 'Original' });
      const { rerender, result } = renderHook(({ p }) => useInlineSVG(p, cacheStore), {
        initialProps: { p: props },
      });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      const firstElement = result.current.element;

      fetchMock.mockClear();

      rerender({ p: { ...props, title: 'Updated' } });

      await waitFor(() => {
        expect(result.current.element).not.toBe(firstElement);
      });

      expect(result.current.status).toBe(STATUS.READY);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should re-render element when description changes without re-fetching', async () => {
      const props = defaultProps({ description: 'Original' });
      const { rerender, result } = renderHook(({ p }) => useInlineSVG(p, cacheStore), {
        initialProps: { p: props },
      });

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      const firstElement = result.current.element;

      fetchMock.mockClear();

      rerender({ p: { ...props, description: 'Updated' } });

      await waitFor(() => {
        expect(result.current.element).not.toBe(firstElement);
      });

      expect(result.current.status).toBe(STATUS.READY);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('preProcessor', () => {
    it('should apply preProcessor to SVG content', async () => {
      const preProcessor = vi.fn((code: string) => code.replace('<circle />', '<rect />'));

      const { result } = renderHook(() => useInlineSVG(defaultProps({ preProcessor }), cacheStore));

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(preProcessor).toHaveBeenCalledWith(svgContent);
    });

    it('should apply preProcessor to inline SVG string', async () => {
      const preProcessor = vi.fn((code: string) => code.replace('<circle />', '<rect />'));

      const { result } = renderHook(() =>
        useInlineSVG(defaultProps({ src: svgContent, preProcessor }), cacheStore),
      );

      await waitFor(() => {
        expect(result.current.status).toBe(STATUS.READY);
      });

      expect(preProcessor).toHaveBeenCalledWith(svgContent);
    });
  });
});
