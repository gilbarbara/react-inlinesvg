import { ReactNode, Ref, SVGProps } from 'react';

import { STATUS } from './config';

/**
 * Called when loading the SVG fails.
 */
export type ErrorCallback = (error: Error | FetchError) => void;

/**
 * Called when the SVG loads successfully.
 */
export type LoadCallback = (src: string, isCached: boolean) => void;

/**
 * Pre-processes the SVG string before parsing.
 * Must return a string.
 */
export type PreProcessorCallback = (code: string) => string;

export type Props = Simplify<
  Omit<SVGProps<SVGElement>, 'onLoad' | 'onError' | 'ref'> & {
    /**
     * A URL to prepend to url() references inside the SVG when using `uniquifyIDs`.
     * Only required if your page uses an HTML `<base>` tag.
     */
    baseURL?: string;
    /**
     * Cache remote SVGs in memory.
     *
     * When used with the CacheProvider, requests are also persisted in the browser cache.
     * @default true
     */
    cacheRequests?: boolean;
    /**
     * Fallback content rendered on fetch error or unsupported browser.
     */
    children?: ReactNode;
    /**
     * A description for the SVG.
     * Overrides an existing `<desc>` tag.
     */
    description?: string;
    /**
     * Custom options for the fetch request.
     */
    fetchOptions?: RequestInit;
    /**
     * A ref to the rendered SVG element.
     * Not available on initial render — use `onLoad` instead.
     */
    innerRef?: Ref<SVGElement | null>;
    /**
     * A component shown while the SVG is loading.
     */
    loader?: ReactNode;
    /**
     * Called when loading the SVG fails.
     * Receives an `Error` or `FetchError`.
     */
    onError?: ErrorCallback;
    /**
     * Called when the SVG loads successfully.
     * Receives the `src` and an `isCached` flag.
     */
    onLoad?: LoadCallback;
    /**
     * A function to pre-process the SVG string before parsing.
     * Must return a string.
     */
    preProcessor?: PreProcessorCallback;
    /**
     * The SVG to load.
     * Accepts a URL or path, a data URI (base64 or URL-encoded), or a raw SVG string.
     */
    src: string;
    /**
     * A title for the SVG. Overrides an existing `<title>` tag.
     * Pass `null` to remove it.
     */
    title?: string | null;
    /**
     * A string to use with `uniquifyIDs`.
     * @default random 8-character alphanumeric string
     */
    uniqueHash?: string;
    /**
     * Create unique IDs for each icon.
     * @default false
     */
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
  error?: Error;
  status: Status;
}
