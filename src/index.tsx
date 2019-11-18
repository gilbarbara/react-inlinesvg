import * as React from 'react';

import convert from 'react-from-dom';

import { canUseDOM, InlineSVGError, isSupportedEnvironment, randomString } from './helpers';

export interface IProps {
  baseURL?: string;
  cacheRequests?: boolean;
  children?: React.ReactNode;
  description?: string;
  loader?: React.ReactNode;
  innerRef?: React.Ref<HTMLElement>;
  onError?: (error: InlineSVGError | IFetchError) => void;
  onLoad?: (src: string, isCached: boolean) => void;
  preProcessor?: (code: string) => string;
  src: string;
  title?: string;
  uniqueHash?: string;
  uniquifyIDs?: boolean;
  [key: string]: any;
}

export interface IState {
  content: string;
  element: React.ReactNode;
  hasCache: boolean;
  status: string;
}

export interface IFetchError extends Error {
  code: string;
  errno: string;
  message: string;
  type: string;
}

export interface IStorageItem {
  content: string;
  queue: any[];
  status: string;
}

export const STATUS = {
  FAILED: 'failed',
  LOADED: 'loaded',
  LOADING: 'loading',
  PENDING: 'pending',
  READY: 'ready',
  UNSUPPORTED: 'unsupported',
};

const cacheStore: { [key: string]: IStorageItem } = Object.create(null);

export default class InlineSVG extends React.PureComponent<IProps, IState> {
  public static defaultProps = {
    cacheRequests: true,
    uniquifyIDs: false,
  };

  // tslint:disable-next-line:variable-name
  private _isMounted = false;
  private readonly hash: string;

  constructor(props: IProps) {
    super(props);

    this.state = {
      content: '',
      element: null,
      hasCache: !!props.cacheRequests && !!cacheStore[props.src],
      status: STATUS.PENDING,
    };

    this.hash = props.uniqueHash || randomString(8);
  }

  public componentDidMount() {
    this._isMounted = true;

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

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
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

    [...node.children].map(d => {
      if (d.attributes && d.attributes.length) {
        const attributes = Object.values(d.attributes);

        attributes.forEach(a => {
          const match = a.value.match(/url\((.*?)\)/);

          if (match && match[1]) {
            a.value = a.value.replace(match[0], `url(${baseURL}${match[1]}__${this.hash})`);
          }
        });

        replaceableAttributes.forEach(r => {
          const attribute = attributes.find(a => a.name === r);

          if (attribute && !isDataValue(r, attribute.value)) {
            attribute.value = `${attribute.value}__${this.hash}`;
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

  private getNode() {
    const { description, title } = this.props;

    try {
      const svgText = this.processSVG();
      const node = convert(svgText, { nodeOnly: true });

      if (!node || !(node instanceof SVGSVGElement)) {
        throw new InlineSVGError('Could not convert the src to a DOM Node');
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
      this.handleError(error);
    }
  }

  private getElement() {
    try {
      const node = this.getNode() as Node;
      const element = convert(node);

      if (!element || !React.isValidElement(element)) {
        throw new InlineSVGError('Could not convert the src to a React element');
      }

      this.setState({
        element,
        status: STATUS.READY,
      });
    } catch (error) {
      this.handleError(new InlineSVGError(error.message));
    }
  }

  private load() {
    /* istanbul ignore else */
    if (this._isMounted) {
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
              cache.queue.push(this.handleLoad);
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

  private handleLoad = (content: string) => {
    /* istanbul ignore else */
    if (this._isMounted) {
      this.setState(
        {
          content,
          status: STATUS.LOADED,
        },
        this.getElement,
      );
    }
  };

  private handleError = (error: InlineSVGError | IFetchError) => {
    const { onError } = this.props;
    const status =
      error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED;

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // tslint:disable-next-line:no-console
      console.error(error);
    }

    /* istanbul ignore else */
    if (this._isMounted) {
      this.setState({ status }, () => {
        /* istanbul ignore else */
        if (typeof onError === 'function') {
          onError(error);
        }
      });
    }
  };

  private request = () => {
    const { cacheRequests, src } = this.props;

    try {
      if (cacheRequests) {
        cacheStore[src] = { content: '', status: STATUS.LOADING, queue: [] };
      }

      return fetch(src)
        .then(response => {
          const contentType = response.headers.get('content-type');
          const [fileType] = (contentType || '').split(/ ?; ?/);

          if (response.status > 299) {
            throw new InlineSVGError('Not Found');
          }

          if (!['image/svg+xml', 'text/plain'].some(d => fileType.indexOf(d) >= 0)) {
            throw new InlineSVGError(`Content type isn't valid: ${fileType}`);
          }

          return response.text();
        })
        .then(content => {
          this.handleLoad(content);

          /* istanbul ignore else */
          if (cacheRequests) {
            const cache = cacheStore[src];

            /* istanbul ignore else */
            if (cache) {
              cache.content = content;
              cache.status = STATUS.LOADED;

              cache.queue = cache.queue.filter((cb: (content: string) => void) => {
                cb(content);

                return false;
              });
            }
          }
        })
        .catch(error => {
          /* istanbul ignore else */
          if (cacheRequests) {
            delete cacheStore[src];
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
    const {
      baseURL,
      cacheRequests,
      children = null,
      description,
      innerRef,
      loader = null,
      onError,
      onLoad,
      preProcessor,
      src,
      title,
      uniqueHash,
      uniquifyIDs,
      ...rest
    } = this.props;

    if (element) {
      return React.cloneElement(element as React.ReactElement, { ref: innerRef, ...rest });
    }

    if ([STATUS.UNSUPPORTED, STATUS.FAILED].indexOf(status) > -1) {
      return children;
    }

    return loader;
  }
}
