import * as React from 'react';
import convert from 'react-from-dom';

import { canUseDOM, isSupportedEnvironment, omit, randomString, STATUS } from './helpers';
import { FetchError, Props, State, StorageItem } from './types';

export const cacheStore: { [key: string]: StorageItem } = Object.create(null);

export default class InlineSVG extends React.PureComponent<Props, State> {
  private isInitialized = false;
  private isActive = false;
  private readonly hash: string;

  public static defaultProps = {
    cacheRequests: true,
    uniquifyIDs: false,
  };

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

  public componentDidMount(): void {
    this.isActive = true;

    if (!canUseDOM() || this.isInitialized) {
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
    } catch (error: any) {
      this.handleError(error);
    }

    this.isInitialized = true;
  }

  public componentDidUpdate(previousProps: Props, previousState: State): void {
    if (!canUseDOM()) {
      return;
    }

    const { hasCache, status } = this.state;
    const { onLoad, src } = this.props;

    if (previousState.status !== STATUS.READY && status === STATUS.READY) {
      /* istanbul ignore else */
      if (onLoad) {
        onLoad(src, hasCache);
      }
    }

    if (previousProps.src !== src) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      this.handleError(new Error(error.message));
    }
  }

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
        cacheStore[src] = { content: '', status: STATUS.LOADING };
      }

      return fetch(src, fetchOptions)
        .then(response => {
          const contentType = response.headers.get('content-type');
          const [fileType] = (contentType || '').split(/ ?; ?/);

          if (response.status > 299) {
            throw new Error('Not found');
          }

          if (!['image/svg+xml', 'text/plain'].some(d => fileType.includes(d))) {
            throw new Error(`Content type isn't valid: ${fileType}`);
          }

          return response.text();
        })
        .then(content => {
          const { src: currentSrc } = this.props;

          // the current src don't match the previous one, skipping...
          if (src !== currentSrc) {
            if (cacheStore[src].status === STATUS.LOADING) {
              delete cacheStore[src];
            }

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
            }
          }
        })
        .catch(error => {
          this.handleError(error);

          /* istanbul ignore else */
          if (cacheRequests) {
            const cache = cacheStore[src];

            /* istanbul ignore else */
            if (cache) {
              delete cacheStore[src];
            }
          }
        });
    } catch (error: any) {
      return this.handleError(new Error(error.message));
    }
  };

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

          if (cache && cache.status === STATUS.LOADED) {
            this.handleLoad(cache.content);

            return;
          }

          const dataURI = src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
          let inlineSrc;

          if (dataURI) {
            inlineSrc = dataURI[1] ? window.atob(dataURI[2]) : decodeURIComponent(dataURI[2]);
          } else if (src.includes('<svg')) {
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

  private updateSVGAttributes(node: SVGSVGElement): SVGSVGElement {
    const { baseURL = '', uniquifyIDs } = this.props;
    const replaceableAttributes = ['id', 'href', 'xlink:href', 'xlink:role', 'xlink:arcrole'];
    const linkAttributes = ['href', 'xlink:href'];
    const isDataValue = (name: string, value: string) =>
      linkAttributes.includes(name) && (value ? !value.includes('#') : false);

    if (!uniquifyIDs) {
      return node;
    }

    [...node.children].map(d => {
      if (d.attributes && d.attributes.length) {
        const attributes = Object.values(d.attributes).map(a => {
          const attribute = a;
          const match = a.value.match(/url\((.*?)\)/);

          if (match && match[1]) {
            attribute.value = a.value.replace(match[0], `url(${baseURL}${match[1]}__${this.hash})`);
          }

          return attribute;
        });

        replaceableAttributes.forEach(r => {
          const attribute = attributes.find(a => a.name === r);

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

  private processSVG() {
    const { content } = this.state;
    const { preProcessor } = this.props;

    if (preProcessor) {
      return preProcessor(content);
    }

    return content;
  }

  public render(): React.ReactNode {
    const { element, status } = this.state;
    const { children = null, innerRef, loader = null } = this.props;
    const elementProps = omit(
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

    if ([STATUS.UNSUPPORTED, STATUS.FAILED].includes(status)) {
      return children;
    }

    return loader;
  }
}

export * from './types';
