import * as React from 'react';

export interface Props extends Omit<React.HTMLProps<SVGElement>, 'onLoad' | 'onError'> {
  baseURL?: string;
  cacheRequests?: boolean;
  children?: React.ReactNode;
  description?: string;
  innerRef?: React.Ref<HTMLElement>;
  loader?: React.ReactNode;
  onError?: (error: Error | FetchError) => void;
  onLoad?: (src: string, isCached: boolean) => void;
  preProcessor?: (code: string) => string;
  src: string;
  title?: string;
  uniqueHash?: string;
  uniquifyIDs?: boolean;
}

export interface State {
  content: string;
  element: React.ReactNode;
  hasCache: boolean;
  status: string;
}

export interface FetchError extends Error {
  code: string;
  errno: string;
  message: string;
  type: string;
}

export interface StorageItem {
  content: string;
  queue: any[];
  status: string;
}
