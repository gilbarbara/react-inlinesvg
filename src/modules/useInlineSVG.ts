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
    cacheRequests = true,
    description,
    fetchOptions,
    onError,
    onLoad,
    src,
    title,
    uniqueHash,
  } = props;

  const [state, setState] = useReducer(
    (previousState: State, nextState: Partial<State>) => ({
      ...previousState,
      ...nextState,
    }),
    {
      content: '',
      element: null,
      isCached: cacheRequests && cacheStore.isCached(props.src),
      status: STATUS.IDLE,
    },
  );
  const { content, element, isCached, status } = state;
  const previousProps = usePrevious(props);
  const previousState = usePrevious(state);

  const hash = useRef(uniqueHash ?? randomString(8));
  const isActive = useRef(false);
  const isInitialized = useRef(false);

  const handleError = useCallback(
    (error: Error | FetchError) => {
      if (isActive.current) {
        setState({
          status:
            error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED,
        });

        onError?.(error);
      }
    },
    [onError],
  );

  const handleLoad = useCallback((loadedContent: string, hasCache = false) => {
    if (isActive.current) {
      setState({
        content: loadedContent,
        isCached: hasCache,
        status: STATUS.LOADED,
      });
    }
  }, []);

  const fetchContent = useCallback(async () => {
    const responseContent: string = await request(src, fetchOptions);

    handleLoad(responseContent);
  }, [fetchOptions, handleLoad, src]);

  const getElement = useCallback(() => {
    try {
      const node = getNode({ ...props, handleError, hash: hash.current, content }) as Node;
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
  }, [content, handleError, props]);

  const getContent = useCallback(async () => {
    const dataURI = /^data:image\/svg[^,]*?(;base64)?,(.*)/.exec(src);
    let inlineSrc;

    if (dataURI) {
      inlineSrc = dataURI[1] ? window.atob(dataURI[2]) : decodeURIComponent(dataURI[2]);
    } else if (src.includes('<svg')) {
      inlineSrc = src;
    }

    if (inlineSrc) {
      handleLoad(inlineSrc);

      return;
    }

    try {
      if (cacheRequests) {
        const cachedContent = await cacheStore.get(src, fetchOptions);

        handleLoad(cachedContent, true);
      } else {
        await fetchContent();
      }
    } catch (error: any) {
      handleError(error);
    }
  }, [cacheRequests, cacheStore, fetchContent, fetchOptions, handleError, handleLoad, src]);

  const load = useCallback(async () => {
    if (isActive.current) {
      setState({
        content: '',
        element: null,
        isCached: false,
        status: STATUS.LOADING,
      });
    }
  }, []);

  // Mount
  useMount(() => {
    isActive.current = true;

    if (!canUseDOM() || isInitialized.current) {
      return undefined;
    }

    try {
      if (status === STATUS.IDLE) {
        if (!isSupportedEnvironment()) {
          throw new Error('Browser does not support SVG');
        }

        if (!src) {
          throw new Error('Missing src');
        }

        load();
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

      load();
    }
  }, [handleError, load, previousProps, src]);

  // Title and description changes
  useEffect(() => {
    if (!canUseDOM() || !previousProps || previousProps.src !== src) {
      return;
    }

    if (previousProps.title !== title || previousProps.description !== description) {
      getElement();
    }
  }, [description, getElement, previousProps, src, title]);

  // State transitions
  useEffect(() => {
    if (!previousState) {
      return;
    }

    switch (status) {
      case STATUS.LOADING: {
        if (previousState.status !== STATUS.LOADING) {
          getContent();
        }

        break;
      }
      case STATUS.LOADED: {
        if (previousState.status !== STATUS.LOADED) {
          getElement();
        }

        break;
      }
      case STATUS.READY: {
        if (previousState.status !== STATUS.READY) {
          onLoad?.(src, isCached);
        }

        break;
      }
    }
  }, [getContent, getElement, isCached, onLoad, previousState, src, status]);

  return { element, status };
}
