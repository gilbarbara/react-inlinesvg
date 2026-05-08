import { cloneElement, ReactElement, ReactNode, SVGProps } from 'react';

import { STATUS } from './config';
import CacheStore from './modules/cache';
import { canUseDOM, omit } from './modules/helpers';
import useInlineSVG from './modules/useInlineSVG';
import { useCacheStore } from './provider';
import { Props, Status } from './types';

export const cacheStore = new CacheStore();

export default function InlineSVG(props: Props): ReactNode {
  const { children = null, innerRef, loader = null } = props;
  const contextStore = useCacheStore();
  const store = contextStore ?? cacheStore;

  const { element, status } = useInlineSVG(props, store);

  if (!canUseDOM()) {
    return loader;
  }

  if (element) {
    return cloneElement(element as ReactElement<SVGProps<SVGElement>>, {
      ref: innerRef,
      ...omit(
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
      ),
    });
  }

  if (([STATUS.UNSUPPORTED, STATUS.FAILED] as Status[]).includes(status)) {
    return children;
  }

  return loader;
}

export * from './types';
