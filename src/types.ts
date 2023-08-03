import * as React from 'react';

import { STATUS } from './helpers';

export type ErrorCallback = (error: Error | FetchError) => void;
export type LoadCallback = (src: string, isCached: boolean) => void;
export type PlainObject<T = unknown> = Record<string, T>;
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
  title?: string | null;
  uniqueHash?: string;
  uniquifyIDs?: boolean;
}

export interface State {
  content: string;
  element: React.ReactNode;
  hasCache: boolean;
  status: Status;
}

export interface FetchError extends Error {
  code: string;
  errno: string;
  message: string;
  type: string;
}

export type Status = (typeof STATUS)[keyof typeof STATUS];

export interface StorageItem {
  content: string;
  status: Status;
}
