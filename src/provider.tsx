import { ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

declare global {
  interface Window {
    REACT_INLINESVG_PERSISTENT_CACHE?: boolean;
  }
}

export default function CacheProvider({ children }: Props) {
  window.REACT_INLINESVG_PERSISTENT_CACHE = true;

  useEffect(() => {
    window.REACT_INLINESVG_PERSISTENT_CACHE = true;

    return () => {
      delete window.REACT_INLINESVG_PERSISTENT_CACHE;
    };
  }, []);

  return children;
}
