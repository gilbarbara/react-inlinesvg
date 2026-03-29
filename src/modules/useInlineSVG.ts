import { isValidElement, useCallback, useEffect, useReducer, useRef } from 'react';
import convert from 'react-from-dom';

import { STATUS } from '../config';
import type { FetchError, Props, State } from '../types';

import type CacheStore from './cache';
import { canUseDOM, isSupportedEnvironment, randomString, request } from './helpers';
import { useMount, usePrevious } from './hooks';
import { getNode } from './utils';

export default function useInlineSVG(props: Props, cacheStore: CacheStore) {
  const {
    baseURL,
    cacheRequests = true,
    description,
    fetchOptions,
    onError,
    onLoad,
    preProcessor,
    src,
    title,
    uniqueHash,
    uniquifyIDs,
  } = props;

  const hash = useRef(uniqueHash ?? randomString(8));
  const fetchOptionsRef = useRef(fetchOptions);
  const onErrorRef = useRef(onError);
  const onLoadRef = useRef(onLoad);
  const preProcessorRef = useRef(preProcessor);

  fetchOptionsRef.current = fetchOptions;
  onErrorRef.current = onError;
  onLoadRef.current = onLoad;
  preProcessorRef.current = preProcessor;

  const [state, setState] = useReducer(
    (previousState: State, nextState: Partial<State>) => ({
      ...previousState,
      ...nextState,
    }),
    {
      content: '',
      element: null,
      isCached: false,
      status: STATUS.IDLE,
    },
    (initial): State => {
      const cached = cacheRequests && cacheStore.isCached(src);

      if (!cached) {
        return initial;
      }

      const cachedContent = cacheStore.getContent(src);

      try {
        const node = getNode({
          ...props,
          handleError: () => {},
          hash: hash.current,
          content: cachedContent,
        });

        if (!node) {
          return { ...initial, content: cachedContent, isCached: true, status: STATUS.LOADED };
        }

        const convertedElement = convert(node as Node);

        if (convertedElement && isValidElement(convertedElement)) {
          return {
            content: cachedContent,
            element: convertedElement,
            isCached: true,
            status: STATUS.READY,
          };
        }
      } catch {
        // Fall through to effect-driven flow
      }

      return {
        ...initial,
        content: cachedContent,
        isCached: true,
        status: STATUS.LOADED,
      };
    },
  );
  const { content, element, isCached, status } = state;
  const previousProps = usePrevious(props);
  const previousState = usePrevious(state);
  const isActive = useRef(false);
  const isInitialized = useRef(false);

  const handleError = useCallback((error: Error | FetchError) => {
    if (isActive.current) {
      setState({
        status:
          error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED,
      });

      onErrorRef.current?.(error);
    }
  }, []);

  const getElement = useCallback(() => {
    try {
      const node = getNode({
        baseURL,
        content,
        description,
        handleError,
        hash: hash.current,
        preProcessor: preProcessorRef.current,
        src,
        title,
        uniquifyIDs,
      }) as Node;
      const convertedElement = convert(node);

      if (!convertedElement || !isValidElement(convertedElement)) {
        throw new Error('Could not convert the src to a React element');
      }

      setState({
        element: convertedElement,
        status: STATUS.READY,
      });
    } catch (error: any) {
      handleError(error);
    }
  }, [baseURL, content, description, handleError, src, title, uniquifyIDs]);

  // Mount
  useMount(() => {
    isActive.current = true;

    if (!canUseDOM() || isInitialized.current) {
      return undefined;
    }

    try {
      if (status === STATUS.READY) {
        onLoadRef.current?.(src, isCached);
      } else if (status === STATUS.IDLE) {
        if (!isSupportedEnvironment()) {
          throw new Error('Browser does not support SVG');
        }

        if (!src) {
          throw new Error('Missing src');
        }

        setState({ content: '', element: null, isCached: false, status: STATUS.LOADING });
      }
    } catch (error: any) {
      handleError(error);
    }

    isInitialized.current = true;

    return () => {
      isActive.current = false;
    };
  });

  // Src changes
  useEffect(() => {
    if (!canUseDOM() || !previousProps) {
      return;
    }

    if (previousProps.src !== src) {
      if (!src) {
        handleError(new Error('Missing src'));

        return;
      }

      setState({ content: '', element: null, isCached: false, status: STATUS.LOADING });
    }
  }, [handleError, previousProps, src]);

  // Fetch content when status is LOADING
  useEffect(() => {
    if (status !== STATUS.LOADING) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const dataURI = /^data:image\/svg[^,]*?(;base64)?,(.*)/.exec(src);
        let inlineSrc;

        if (dataURI) {
          inlineSrc = dataURI[1] ? window.atob(dataURI[2]) : decodeURIComponent(dataURI[2]);
        } else if (src.includes('<svg')) {
          inlineSrc = src;
        }

        if (inlineSrc) {
          if (active) {
            setState({ content: inlineSrc, isCached: false, status: STATUS.LOADED });
          }

          return;
        }

        const fetchParameters = { ...fetchOptionsRef.current, signal: controller.signal };
        let loadedContent: string;
        let hasCache = false;

        if (cacheRequests) {
          hasCache = cacheStore.isCached(src);
          loadedContent = await cacheStore.get(src, fetchParameters);
        } else {
          loadedContent = await request(src, fetchParameters);
        }

        if (active) {
          setState({ content: loadedContent, isCached: hasCache, status: STATUS.LOADED });
        }
      } catch (error: any) {
        if (active && error.name !== 'AbortError') {
          handleError(error);
        }
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheRequests, cacheStore, handleError, src, status]);

  // LOADED -> READY
  useEffect(() => {
    if (status === STATUS.LOADED && content) {
      getElement();
    }
  }, [content, getElement, status]);

  // Title and description changes
  useEffect(() => {
    if (!canUseDOM() || !previousProps || previousProps.src !== src) {
      return;
    }

    if (previousProps.title !== title || previousProps.description !== description) {
      getElement();
    }
  }, [description, getElement, previousProps, src, title]);

  // READY -> onLoad
  useEffect(() => {
    if (!previousState) {
      return;
    }

    if (status === STATUS.READY && previousState.status !== STATUS.READY) {
      onLoadRef.current?.(src, isCached);
    }
  }, [isCached, previousState, src, status]);

  return { element, status };
}
