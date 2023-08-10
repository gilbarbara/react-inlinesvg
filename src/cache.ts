import { CACHE_MAX_RETRIES, CACHE_NAME, STATUS } from './config';
import { request, sleep } from './helpers';
import { StorageItem } from './types';

export default class CacheStore {
  private cacheApi: Cache | undefined;
  private readonly cacheStore: Map<string, StorageItem>;
  private readonly subscribers: Array<() => void> = [];
  private readonly usePersistentCache: boolean;
  public isReady = false;

  constructor() {
    this.cacheStore = new Map<string, StorageItem>();

    this.usePersistentCache =
      'REACT_INLINESVG_PERSISTENT_CACHE' in window && !!window.REACT_INLINESVG_PERSISTENT_CACHE;

    if (this.usePersistentCache) {
      caches.open(CACHE_NAME).then(cache => {
        this.cacheApi = cache;
        this.isReady = true;

        this.subscribers.forEach(callback => callback());
      });
    } else {
      this.isReady = true;
    }
  }

  public onReady(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.subscribers.push(callback);
    }
  }

  public async get(url: string, fetchOptions?: RequestInit) {
    await (this.usePersistentCache
      ? this.fetchAndAddToPersistentCache(url, fetchOptions)
      : this.fetchAndAddToInternalCache(url, fetchOptions));

    return this.cacheStore.get(url)?.content ?? '';
  }

  public set(url: string, data: StorageItem) {
    this.cacheStore.set(url, data);
  }

  public isCached(url: string) {
    return this.cacheStore.get(url)?.status === STATUS.LOADED;
  }

  private async fetchAndAddToInternalCache(url: string, fetchOptions?: RequestInit) {
    const cache = this.cacheStore.get(url);

    if (cache?.status === STATUS.LOADING) {
      await this.handleLoading(url, async () => {
        this.cacheStore.set(url, { content: '', status: STATUS.IDLE });
        await this.fetchAndAddToInternalCache(url, fetchOptions);
      });

      return;
    }

    if (!cache?.content) {
      this.cacheStore.set(url, { content: '', status: STATUS.LOADING });

      try {
        const content = await request(url, fetchOptions);

        this.cacheStore.set(url, { content, status: STATUS.LOADED });
      } catch (error: any) {
        this.cacheStore.set(url, { content: '', status: STATUS.FAILED });
        throw error;
      }
    }
  }

  private async fetchAndAddToPersistentCache(url: string, fetchOptions?: RequestInit) {
    const cache = this.cacheStore.get(url);

    if (cache?.status === STATUS.LOADED) {
      return;
    }

    if (cache?.status === STATUS.LOADING) {
      await this.handleLoading(url, async () => {
        this.cacheStore.set(url, { content: '', status: STATUS.IDLE });
        await this.fetchAndAddToPersistentCache(url, fetchOptions);
      });

      return;
    }

    this.cacheStore.set(url, { content: '', status: STATUS.LOADING });

    const data = await this.cacheApi?.match(url);

    if (data) {
      const content = await data.text();

      this.cacheStore.set(url, { content, status: STATUS.LOADED });

      return;
    }

    try {
      await this.cacheApi?.add(new Request(url, fetchOptions));

      const response = await this.cacheApi?.match(url);
      const content = (await response?.text()) ?? '';

      this.cacheStore.set(url, { content, status: STATUS.LOADED });
    } catch (error: any) {
      this.cacheStore.set(url, { content: '', status: STATUS.FAILED });
      throw error;
    }
  }

  private async handleLoading(url: string, callback: () => Promise<void>) {
    let retryCount = 0;

    // eslint-disable-next-line no-await-in-loop
    while (this.cacheStore.get(url)?.status === STATUS.LOADING && retryCount < CACHE_MAX_RETRIES) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(0.1);
      retryCount += 1;
    }

    if (retryCount >= CACHE_MAX_RETRIES) {
      await callback();
    }
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

      for (const key of keys) {
        // eslint-disable-next-line no-await-in-loop
        await this.cacheApi.delete(key);
      }
    }

    this.cacheStore.clear();
  }
}