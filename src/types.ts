import * as React from 'react';

export interface Props {
  baseURL?: string;
  cacheRequests?: boolean;
  children?: React.ReactNode;
  description?: string;
  loader?: React.ReactNode;
  innerRef?: React.Ref<HTMLElement>;
  onError?: (error: Error | FetchError) => void;
  onLoad?: (src: string, isCached: boolean) => void;
  preProcessor?: (code: string) => string;
  src: string;
  title?: string;
  uniqueHash?: string;
  uniquifyIDs?: boolean;
  [key: string]: any;
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
