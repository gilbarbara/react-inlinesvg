import React, { cloneElement, ReactElement, SVGProps, useEffect, useState } from 'react';

import { STATUS } from './config';
import CacheStore from './modules/cache';
import { canUseDOM, omit } from './modules/helpers';
import useInlineSVG from './modules/useInlineSVG';
import { Props, Status } from './types';

// eslint-disable-next-line import-x/no-mutable-exports
export let cacheStore: CacheStore;

function ReactInlineSVG(props: Props) {
  const { children = null, innerRef, loader = null } = props;
  const { element, status } = useInlineSVG(props, cacheStore);

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
    return cloneElement(element as ReactElement<SVGProps<SVGElement>>, {
      ref: innerRef,
      ...elementProps,
    });
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
  const [isReady, setReady] = useState(cacheStore.isReady);

  useEffect(() => {
    if (isReady) {
      return;
    }

    cacheStore.onReady(() => {
      setReady(true);
    });
  }, [isReady]);

  if (!isReady) {
    return loader;
  }

  return <ReactInlineSVG {...props} />;
}

export * from './types';
