/* eslint-disable no-underscore-dangle */
import React from 'react';

// @ts-ignore
import DomToReact from 'dom-to-react';

import { canUseDOM, InlineSVGError, isSupportedEnvironment, randomString } from './utils';

export interface Props {
  baseURL?: string;
  cacheRequests?: boolean;
  cacheFailedRequests?: boolean;
  children?: React.ReactNode;
  description?: string;
  loader?: React.ReactNode;
  onError?: (error: InlineSVGError | FetchError) => void;
  onLoad?: (src: URL | string, isCached: boolean) => void;
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
  message: string;
  type: string;
  errno: string;
  code: string;
}

export interface StorageItem {
  url: string;
  content: string;
  queue: any[];
  loading: boolean;
}

export const STATUS = {
  FAILED: 'failed',
  LOADED: 'loaded',
  LOADING: 'loading',
  PENDING: 'pending',
  READY: 'ready',
  UNSUPPORTED: 'unsupported',
};

// export const storage: StorageItem[] = [];
export const storage: { [key: string]: StorageItem } = {};

export default class InlineSVG extends React.PureComponent<Props, State> {
  private static defaultProps = {
    cacheFailedRequests: false,
    cacheRequests: true,
    uniquifyIDs: false,
  };

  // tslint:disable-next-line:variable-name
  private _isMounted: boolean;

  constructor(props: Props) {
    super(props);

    this.state = {
      content: '',
      element: null,
      hasCache: !!props.cacheRequests && props.src in storage,
      status: STATUS.PENDING,
    };

    this._isMounted = false;
  }

  public componentDidMount() {
    this.isMounted = true;

    if (!canUseDOM()) {
      this.handleError(new InlineSVGError('No DOM'));
      return;
    }

    const { status } = this.state;
    const { src } = this.props;

    try {
      /* istanbul ignore else */
      if (status === STATUS.PENDING) {
        /* istanbul ignore else */
        if (!isSupportedEnvironment()) {
          throw new InlineSVGError('Browser does not support SVG');
        }

        /* istanbul ignore else */
        if (!src) {
          throw new InlineSVGError('Missing src');
        }

        this.load();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State) {
    if (!canUseDOM()) {
      return;
    }

    const { hasCache, status } = this.state;
    const { onLoad, src } = this.props;

    if (prevState.status !== STATUS.READY && status === STATUS.READY) {
      /* istanbul ignore else */
      if (onLoad) {
        onLoad(src, hasCache);
      }
    }

    if (prevProps.src !== src) {
      if (!src) {
        this.handleError(new InlineSVGError('Missing src'));
        return;
      }

      this.load();
    }
  }

  public componentWillUnmount() {
    this._isMounted = false;
  }

  get isMounted() {
    return this._isMounted;
  }

  set isMounted(value: boolean) {
    this._isMounted = value;
  }

  private parseSVG() {
    const { content } = this.state;
    const { preProcessor } = this.props;

    if (preProcessor) {
      return preProcessor(content);
    }

    return content;
  }

  private updateSVGAttributes(node: SVGSVGElement): SVGSVGElement {
    const { baseURL = '', uniquifyIDs, uniqueHash } = this.props;
    const replaceableAttributes = ['id', 'href', 'xlink:href', 'xlink:role', 'xlink:arcrole'];

    if (!uniquifyIDs) {
      return node;
    }

    const hash = uniqueHash || randomString();

    [...node.children].map(d => {
      if (d.attributes && d.attributes.length) {
        const attributes = Object.values(d.attributes);

        attributes.forEach(a => {
          const match = a.value.match(/^url\((#[^)]+)/);

          if (match && match[1]) {
            a.value = `url(${baseURL}${match[1]}__${hash})`;
          }
        });

        replaceableAttributes.forEach(r => {
          const attribute = attributes.find(a => a.name === r);

          if (attribute) {
            attribute.value = `${attribute.value}__${hash}`;
          }
        });
      }

      if (d.children.length) {
        d = this.updateSVGAttributes(d as SVGSVGElement);
      }

      return d;
    });

    return node;
  }

  private generateNode() {
    const { description, title } = this.props;

    try {
      const svgText = this.parseSVG();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      let svg = doc.querySelector('svg');

      if (!svg) {
        throw new InlineSVGError('Could not parse the SVG code');
      }

      svg = this.updateSVGAttributes(svg);

      if (description) {
        const originalDesc = svg.querySelector('desc');

        if (originalDesc && originalDesc.parentNode) {
          originalDesc.parentNode.removeChild(originalDesc);
        }

        const descElement = document.createElement('desc');
        descElement.innerHTML = description;
        svg.prepend(descElement);
      }

      if (title) {
        const originalTitle = svg.querySelector('title');

        if (originalTitle && originalTitle.parentNode) {
          originalTitle.parentNode.removeChild(originalTitle);
        }

        const titleElement = document.createElement('title');
        titleElement.innerHTML = title;
        svg.prepend(titleElement);
      }

      return svg;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private generateElement() {
    const {
      baseURL,
      cacheRequests,
      cacheFailedRequests,
      children,
      description,
      onError,
      onLoad,
      loader,
      preProcessor,
      src,
      title,
      uniqueHash,
      uniquifyIDs,
      ...rest
    } = this.props;

    try {
      const node = this.generateNode();

      /* istanbul ignore else */
      if (node) {
        const d2r = new DomToReact();

        this.setState({
          element: React.cloneElement(d2r.prepareNode(node), { ...rest }),
          status: STATUS.READY,
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private load() {
    /* istanbul ignore else */
    if (this.isMounted) {
      this.setState(
        {
          content: '',
          element: null,
          status: STATUS.LOADING,
        },
        () => {
          const { cacheRequests, src } = this.props;
          const cache = cacheRequests && storage[src];

          if (cache) {
            if (cache.loading) {
              cache.queue.push(this.handleLoad);
            } else {
              this.handleLoad(cache.content);
            }

            return;
          }

          const dataURI = src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
          let inlineSrc;

          if (dataURI) {
            inlineSrc = dataURI[1] ? atob(dataURI[2]) : decodeURIComponent(dataURI[2]);
          } else if (src.indexOf('<svg') >= 0) {
            inlineSrc = src;
          }

          if (inlineSrc) {
            this.handleLoad(inlineSrc);
            return;
          }

          this.request();
        },
      );
    }
  }

  private handleLoad = (content: string) => {
    /* istanbul ignore else */
    if (this.isMounted) {
      this.setState(
        {
          content,
          status: STATUS.LOADED,
        },
        this.generateElement,
      );
    }
  };

  private handleError = (error: InlineSVGError | FetchError) => {
    const { onError } = this.props;
    const status =
      error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED;

    if (process.env.NODE_ENV === 'development') {
      console.error(error); // tslint:disable-line:no-console
    }

    /* istanbul ignore else */
    if (this.isMounted) {
      this.setState({ status }, () => {
        /* istanbul ignore else */
        if (typeof onError === 'function') {
          onError(error);
        }
      });
    }
  };

  private request = () => {
    const { cacheRequests, cacheFailedRequests, src } = this.props;

    if (cacheRequests) {
      storage[src] = { url: src, content: '', loading: true, queue: [] };
    }

    try {
      return fetch(src)
        .then(response => {
          if (response.status > 299) {
            throw new InlineSVGError('Not Found');
          }

          return response.text();
        })
        .then(content => {
          /* istanbul ignore else */
          if (cacheRequests && src in storage) {
            const cachedItem = storage[src];
            cachedItem.content = content;
            cachedItem.loading = false;

            cachedItem.queue.forEach((cb: any) => cb(content));
          }

          this.handleLoad(content);
        })
        .catch(error => {
          if (cacheRequests && !cacheFailedRequests) {
            delete storage[src];
          }

          this.handleError(error);
        });
    } catch (error) {
      this.handleError(new InlineSVGError(error.message));
    }
  };

  public render() {
    if (!canUseDOM()) {
      return null;
    }

    const { element, status } = this.state;
    const { children = null, loader = null } = this.props;

    if (element) {
      return element;
    }

    if ([STATUS.UNSUPPORTED, STATUS.FAILED].indexOf(status) > -1) {
      return children;
    }

    return loader;
  }
}
