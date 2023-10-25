import {
  cloneElement,
  isValidElement,
  ReactElement,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import convert from 'react-from-dom';

import { STATUS } from './config';
import CacheStore from './modules/cache';
import { canUseDOM, isSupportedEnvironment, omit, randomString, request } from './modules/helpers';
import { usePrevious } from './modules/hooks';
import { getNode } from './modules/utils';
import { FetchError, Props, State, Status } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let cacheStore: CacheStore;

function ReactInlineSVG(props: Props) {
  const {
    cacheRequests = true,
    children = null,
    description,
    fetchOptions,
    innerRef,
    loader = null,
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
      handleError(new Error(error.message));
    }
  }, [content, handleError, props]);

  const getContent = useCallback(async () => {
    const dataURI = /^data:image\/svg[^,]*?(;base64)?,(.*)/u.exec(src);
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
  }, [cacheRequests, fetchContent, fetchOptions, handleError, handleLoad, src]);

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

  // Run on mount
  useEffect(
    () => {
      isActive.current = true;

      if (!canUseDOM() || isInitialized.current) {
        return () => undefined;
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Handle prop changes
  useEffect(() => {
    if (!canUseDOM()) {
      return;
    }

    if (!previousProps) {
      return;
    }

    if (previousProps.src !== src) {
      if (!src) {
        handleError(new Error('Missing src'));

        return;
      }

      load();
    } else if (previousProps.title !== title || previousProps.description !== description) {
      getElement();
    }
  }, [description, getElement, handleError, load, previousProps, src, title]);

  // handle state
  useEffect(() => {
    if (!previousState) {
      return;
    }

    if (previousState.status !== STATUS.LOADING && status === STATUS.LOADING) {
      getContent();
    }

    if (previousState.status !== STATUS.LOADED && status === STATUS.LOADED) {
      getElement();
    }

    if (previousState.status !== STATUS.READY && status === STATUS.READY) {
      onLoad?.(src, isCached);
    }
  }, [getContent, getElement, isCached, onLoad, previousState, src, status]);

  const elementProps = omit(
    props,
    'baseURL',
    'cacheRequests',
    'children',
    'description',
    'fetchOptions',
    'innerRef',
    'loader',
    'onError',
    'onLoad',
    'preProcessor',
    'src',
    'title',
    'uniqueHash',
    'uniquifyIDs',
  );

  if (!canUseDOM()) {
    return loader;
  }

  if (element) {
    return cloneElement(element as ReactElement, { ref: innerRef, ...elementProps });
  }

  if (([STATUS.UNSUPPORTED, STATUS.FAILED] as Status[]).includes(status)) {
    return children;
  }

  return loader;
}

export default function InlineSVG(props: Props) {
  if (!cacheStore) {
    cacheStore = new CacheStore();
  }

  const { loader } = props;
  const hasCallback = useRef(false);
  const [isReady, setReady] = useState(cacheStore.isReady);

  useEffect(() => {
    if (!hasCallback.current) {
      cacheStore.onReady(() => {
        setReady(true);
      });

      hasCallback.current = true;
    }
  }, []);

  if (!isReady) {
    return loader;
  }

  return <ReactInlineSVG {...props} />;
}

export * from './types';
