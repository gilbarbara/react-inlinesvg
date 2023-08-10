import { ReactNode } from 'react';

import { canUseDOM } from './helpers';

interface Props {
  children: ReactNode;
  name?: string;
}

export default function CacheProvider({ children, name }: Props) {
  if (canUseDOM()) {
    window.REACT_INLINESVG_CACHE_NAME = name;
    window.REACT_INLINESVG_PERSISTENT_CACHE = true;
  }

  return children;
}
