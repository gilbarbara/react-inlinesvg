import * as React from 'react';

type Callback = (...args: any[]) => void;

export type ErrorCallback = (error: Error | FetchError) => void;
export type LoadCallback = (src: string, isCached: boolean) => void;
export type PlainObject<T = unknown> = Record<string | number | symbol, T>;
export type PreProcessorCallback = (code: string) => string;

export interface Props extends Omit<React.SVGProps<SVGElement>, 'onLoad' | 'onError' | 'ref'> {
  baseURL?: string;
  cacheRequests?: boolean;
  children?: React.ReactNode;
  description?: string;
  fetchOptions?: RequestInit;
  innerRef?: React.Ref<SVGElement>;
  loader?: React.ReactNode;
  onError?: ErrorCallback;
  onLoad?: LoadCallback;
  preProcessor?: PreProcessorCallback;
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
  queue: Callback[];
  status: string;
}
