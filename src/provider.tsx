import React, { createContext, ReactNode, useContext, useState } from 'react';

import CacheStore from './modules/cache';

const CacheContext = createContext<CacheStore | null>(null);

interface Props {
  children: ReactNode;
  name?: string;
}

export default function CacheProvider({ children, name }: Props) {
  const [store] = useState(() => new CacheStore({ name, persistent: true }));

  return <CacheContext.Provider value={store}>{children}</CacheContext.Provider>;
}

export function useCacheStore(): CacheStore | null {
  return useContext(CacheContext);
}
