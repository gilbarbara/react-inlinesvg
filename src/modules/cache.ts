import { CACHE_MAX_RETRIES, CACHE_NAME, STATUS } from '../config';
import { StorageItem } from '../types';

import { canUseDOM, request } from './helpers';

export interface CacheStoreOptions {
  name?: string;
  persistent?: boolean;
}

export default class CacheStore {
  private cacheApi: Cache | undefined;
  private readonly cacheStore: Map<string, StorageItem>;
  private readonly subscribers: Array<() => void> = [];
  public isReady = false;

  constructor(options: CacheStoreOptions = {}) {
    const { name = CACHE_NAME, persistent = false } = options;

    this.cacheStore = new Map<string, StorageItem>();

    const usePersistentCache = persistent && canUseDOM() && 'caches' in window;

    if (usePersistentCache) {
      // eslint-disable-next-line promise/catch-or-return
      caches
        .open(name)
        .then(cache => {
          this.cacheApi = cache;
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(`Failed to open cache: ${error.message}`);
          this.cacheApi = undefined;
        })
        .finally(() => {
          this.isReady = true;
          // Copy to avoid mutation issues
          const callbacks = [...this.subscribers];

          // Clear array efficiently
          this.subscribers.length = 0;

          callbacks.forEach(callback => {
            try {
              callback();
            } catch (error: any) {
              // eslint-disable-next-line no-console
              console.error(`Error in CacheStore subscriber callback: ${error.message}`);
            }
          });
        });
    } else {
      this.isReady = true;
    }
  }

  public onReady(callback: () => void): () => void {
    if (this.isReady) {
      callback();

      return () => {};
    }

    this.subscribers.push(callback);

    return () => {
      const index = this.subscribers.indexOf(callback);

      if (index >= 0) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private waitForReady(): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.onReady(resolve);
    });
  }

  public async get(url: string, fetchOptions?: RequestInit) {
    await this.fetchAndCache(url, fetchOptions);

    return this.cacheStore.get(url)?.content ?? '';
  }

  public getContent(url: string): string {
    return this.cacheStore.get(url)?.content ?? '';
  }

  public set(url: string, data: StorageItem) {
    this.cacheStore.set(url, data);
  }

  public isCached(url: string) {
    return this.cacheStore.get(url)?.status === STATUS.LOADED;
  }

  private async fetchAndCache(url: string, fetchOptions?: RequestInit) {
    if (!this.isReady) {
      await this.waitForReady();
    }

    const cache = this.cacheStore.get(url);

    if (cache?.status === STATUS.LOADED) {
      return;
    }

    if (cache?.status === STATUS.LOADING) {
      await this.handleLoading(url, fetchOptions?.signal || undefined, async () => {
        this.cacheStore.set(url, { content: '', status: STATUS.IDLE });
        await this.fetchAndCache(url, fetchOptions);
      });

      const failed = this.cacheStore.get(url);

      if (failed?.status === STATUS.FAILED) {
        if (failed.error) {
          throw failed.error;
        }

        this.cacheStore.delete(url);
        await this.fetchAndCache(url, fetchOptions);
      }

      return;
    }

    this.cacheStore.set(url, { content: '', status: STATUS.LOADING });

    try {
      const content = this.cacheApi
        ? await this.fetchFromPersistentCache(url, fetchOptions)
        : await request(url, fetchOptions);

      this.cacheStore.set(url, { content, status: STATUS.LOADED });
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError';

      this.cacheStore.set(url, {
        content: '',
        error: isAbort ? undefined : error,
        status: STATUS.FAILED,
      });
      throw error;
    }
  }

  private async fetchFromPersistentCache(url: string, fetchOptions?: RequestInit): Promise<string> {
    const data = await this.cacheApi?.match(url);

    if (data) {
      return data.text();
    }

    await this.cacheApi?.add(new Request(url, fetchOptions));

    const response = await this.cacheApi?.match(url);

    return (await response?.text()) ?? '';
  }

  private async handleLoading(
    url: string,
    signal: AbortSignal | undefined,
    callback: () => Promise<void>,
  ) {
    for (let retryCount = 0; retryCount < CACHE_MAX_RETRIES; retryCount++) {
      if (signal?.aborted) {
        throw signal.reason instanceof Error
          ? signal.reason
          : new DOMException('The operation was aborted.', 'AbortError');
      }

      if (this.cacheStore.get(url)?.status !== STATUS.LOADING) {
        return;
      }

      await sleep(0.1);
    }

    await callback();
  }

  public keys(): Array<string> {
    return [...this.cacheStore.keys()];
  }

  public data(): Array<Record<string, StorageItem>> {
    return [...this.cacheStore.entries()].map(([key, value]) => ({ [key]: value }));
  }

  public async delete(url: string) {
    if (this.cacheApi) {
      await this.cacheApi.delete(url);
    }

    this.cacheStore.delete(url);
  }

  public async clear() {
    if (this.cacheApi) {
      const keys = await this.cacheApi.keys();

      await Promise.allSettled(keys.map(key => this.cacheApi!.delete(key)));
    }

    this.cacheStore.clear();
  }
}

function sleep(seconds = 1) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}
