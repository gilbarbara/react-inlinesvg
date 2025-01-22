import { ReactNode, Ref, SVGProps } from 'react';

import { STATUS } from './config';

export type ErrorCallback = (error: Error | FetchError) => void;
export type LoadCallback = (src: string, isCached: boolean) => void;
export type PlainObject<T = unknown> = Record<string, T>;
export type PreProcessorCallback = (code: string) => string;

export type Props = Simplify<
  Omit<SVGProps<SVGElement>, 'onLoad' | 'onError' | 'ref'> & {
    baseURL?: string;
    cacheRequests?: boolean;
    children?: ReactNode;
    description?: string;
    fetchOptions?: RequestInit;
    innerRef?: Ref<SVGElement | null>;
    loader?: ReactNode;
    onError?: ErrorCallback;
    onLoad?: LoadCallback;
    preProcessor?: PreProcessorCallback;
    src: string;
    title?: string | null;
    uniqueHash?: string;
    uniquifyIDs?: boolean;
  }
>;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Status = (typeof STATUS)[keyof typeof STATUS];

export interface FetchError extends Error {
  code: string;
  errno: string;
  message: string;
  type: string;
}

export interface State {
  content: string;
  element: ReactNode;
  isCached: boolean;
  status: Status;
}

export interface StorageItem {
  content: string;
  status: Status;
}
