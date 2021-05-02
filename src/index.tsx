import * as React from 'react';

import convert from 'react-from-dom';

import {
  STATUS,
  canUseDOM,
  isSupportedEnvironment,
  randomString,
  removeProperties,
} from './helpers';
import { FetchError, Props, State, StorageItem } from './types';

export const cacheStore: { [key: string]: StorageItem } = Object.create(null);

export default class InlineSVG extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      content: '',
      element: null,
      hasCache: !!props.cacheRequests && !!cacheStore[props.src],
      status: STATUS.PENDING,
    };

    this.hash = props.uniqueHash || randomString(8);
  }

  private isActive = false;
  private readonly hash: string;

  public static defaultProps = {
    cacheRequests: true,
    uniquifyIDs: false,
  };

  public componentDidMount(): void {
    this.isActive = true;

    if (!canUseDOM()) {
      return;
    }

    const { status } = this.state;
    const { src } = this.props;

    try {
      /* istanbul ignore else */
      if (status === STATUS.PENDING) {
        /* istanbul ignore else */
        if (!isSupportedEnvironment()) {
          throw new Error('Browser does not support SVG');
        }

        /* istanbul ignore else */
        if (!src) {
          throw new Error('Missing src');
        }

        this.load();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  public componentDidUpdate(prevProps: Props, prevState: State): void {
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
        this.handleError(new Error('Missing src'));
        return;
      }

      this.load();
    }
  }

  public componentWillUnmount(): void {
    this.isActive = false;
  }

  private processSVG() {
    const { content } = this.state;
    const { preProcessor } = this.props;

    if (preProcessor) {
      return preProcessor(content);
    }

    return content;
  }

  private updateSVGAttributes(node: SVGSVGElement): SVGSVGElement {
    const { baseURL = '', uniquifyIDs } = this.props;
    const replaceableAttributes = ['id', 'href', 'xlink:href', 'xlink:role', 'xlink:arcrole'];
    const linkAttributes = ['href', 'xlink:href'];
    const isDataValue = (name: string, value: string) =>
      linkAttributes.indexOf(name) >= 0 && (value ? value.indexOf('#') < 0 : false);

    if (!uniquifyIDs) {
      return node;
    }

    [...node.children].map((d) => {
      if (d.attributes && d.attributes.length) {
        const attributes = Object.values(d.attributes).map((a) => {
          const attr = a;
          const match = a.value.match(/url\((.*?)\)/);

          if (match && match[1]) {
            attr.value = a.value.replace(match[0], `url(${baseURL}${match[1]}__${this.hash})`);
          }

          return attr;
        });

        replaceableAttributes.forEach((r) => {
          const attribute = attributes.find((a) => a.name === r);

          if (attribute && !isDataValue(r, attribute.value)) {
            attribute.value = `${attribute.value}__${this.hash}`;
          }
        });
      }

      if (d.children.length) {
        return this.updateSVGAttributes(d as SVGSVGElement);
      }

      return d;
    });

    return node;
  }

  private getNode() {
    const { description, title } = this.props;

    try {
      const svgText = this.processSVG();
      const node = convert(svgText, { nodeOnly: true });

      if (!node || !(node instanceof SVGSVGElement)) {
        throw new Error('Could not convert the src to a DOM Node');
      }

      const svg = this.updateSVGAttributes(node);

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

  private getElement() {
    try {
      const node = this.getNode() as Node;
      const element = convert(node);

      if (!element || !React.isValidElement(element)) {
        throw new Error('Could not convert the src to a React element');
      }

      this.setState({
        element,
        status: STATUS.READY,
      });
    } catch (error) {
      this.handleError(new Error(error.message));
    }
  }

  private load() {
    /* istanbul ignore else */
    if (this.isActive) {
      this.setState(
        {
          content: '',
          element: null,
          status: STATUS.LOADING,
        },
        () => {
          const { cacheRequests, src } = this.props;
          const cache = cacheRequests && cacheStore[src];
          if (cache) {
            /* istanbul ignore else */
            if (cache.status === STATUS.LOADING) {
              cache.queue.push(this.handleCacheQueue);
            } else if (cache.status === STATUS.LOADED) {
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

  private handleCacheQueue = (content: string | Error) => {
    /* istanbul ignore else */
    if (typeof content === 'string') {
      this.handleLoad(content);
      return;
    }

    this.handleError(content);
  };

  private handleLoad = (content: string) => {
    /* istanbul ignore else */
    if (this.isActive) {
      this.setState(
        {
          content,
          status: STATUS.LOADED,
        },
        this.getElement,
      );
    }
  };

  private handleError = (error: Error | FetchError) => {
    const { onError } = this.props;
    const status =
      error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED;

    /* istanbul ignore else */
    if (this.isActive) {
      this.setState({ status }, () => {
        /* istanbul ignore else */
        if (typeof onError === 'function') {
          onError(error);
        }
      });
    }
  };

  private request = () => {
    const { cacheRequests, fetchOptions, src } = this.props;

    try {
      if (cacheRequests) {
        cacheStore[src] = { content: '', status: STATUS.LOADING, queue: [] };
      }

      return fetch(src, fetchOptions)
        .then((response) => {
          const contentType = response.headers.get('content-type');
          const [fileType] = (contentType || '').split(/ ?; ?/);

          if (response.status > 299) {
            throw new Error('Not found');
          }

          if (!['image/svg+xml', 'text/plain'].some((d) => fileType.indexOf(d) >= 0)) {
            throw new Error(`Content type isn't valid: ${fileType}`);
          }

          return response.text();
        })
        .then((content) => {
          const { src: currentSrc } = this.props;

          // the current src don't match the previous one, skipping...
          if (src !== currentSrc) {
            return;
          }

          this.handleLoad(content);

          /* istanbul ignore else */
          if (cacheRequests) {
            const cache = cacheStore[src];

            /* istanbul ignore else */
            if (cache) {
              cache.content = content;
              cache.status = STATUS.LOADED;

              cache.queue = cache.queue.filter((cb) => {
                cb(content);

                return false;
              });
            }
          }
        })
        .catch((error) => {
          this.handleError(error);

          /* istanbul ignore else */
          if (cacheRequests) {
            const cache = cacheStore[src];

            /* istanbul ignore else */
            if (cache) {
              cache.queue.forEach((cb: (content: string) => void) => {
                cb(error);
              });

              delete cacheStore[src];
            }
          }
        });
    } catch (error) {
      return this.handleError(new Error(error.message));
    }
  };

  public render(): React.ReactNode {
    const { element, status } = this.state;
    const { children = null, innerRef, loader = null } = this.props;
    const elementProps = removeProperties(
      this.props,
      'baseURL',
      'cacheRequests',
      'children',
      'description',
      'fetchOptions',
      'innerRef',
      'loader',
      'onError',
      'onLoad',
      'preProcessor',
      'src',
      'title',
      'uniqueHash',
      'uniquifyIDs',
    );

    if (!canUseDOM()) {
      return loader;
    }

    if (element) {
      return React.cloneElement(element as React.ReactElement, { ref: innerRef, ...elementProps });
    }

    if ([STATUS.UNSUPPORTED, STATUS.FAILED].indexOf(status) > -1) {
      return children;
    }

    return loader;
  }
}

export * from './types';
