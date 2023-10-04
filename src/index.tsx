import * as React from 'react';
import convert from 'react-from-dom';

import CacheStore from './cache';
import { STATUS } from './config';
import { canUseDOM, isSupportedEnvironment, omit, randomString, request } from './helpers';
import { FetchError, Props, State, Status } from './types';

// eslint-disable-next-line import/no-mutable-exports
export let cacheStore: CacheStore;

class ReactInlineSVG extends React.PureComponent<Props, State> {
  private readonly hash: string;
  private isActive = false;
  private isInitialized = false;

  public static defaultProps = {
    cacheRequests: true,
    uniquifyIDs: false,
  };

  constructor(props: Props) {
    super(props);

    this.state = {
      content: '',
      element: null,
      isCached: !!props.cacheRequests && cacheStore.isCached(props.src),
      status: STATUS.IDLE,
    };

    this.hash = props.uniqueHash ?? randomString(8);
  }

  public componentDidMount(): void {
    this.isActive = true;

    if (!canUseDOM() || this.isInitialized) {
      return;
    }

    const { status } = this.state;
    const { src } = this.props;

    try {
      if (status === STATUS.IDLE) {
        if (!isSupportedEnvironment()) {
          throw new Error('Browser does not support SVG');
        }

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

    const { isCached, status } = this.state;
    const { description, onLoad, src, title } = this.props;

    if (previousState.status !== STATUS.READY && status === STATUS.READY) {
      if (onLoad) {
        onLoad(src, isCached);
      }
    }

    if (previousProps.src !== src) {
      if (!src) {
        this.handleError(new Error('Missing src'));

        return;
      }

      this.load();
    }

    if (previousProps.title !== title || previousProps.description !== description) {
      this.getElement();
    }
  }

  public componentWillUnmount(): void {
    this.isActive = false;
  }

  private fetchContent = async () => {
    const { fetchOptions, src } = this.props;

    const content: string = await request(src, fetchOptions);

    this.handleLoad(content);
  };

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

        if (originalDesc?.parentNode) {
          originalDesc.parentNode.removeChild(originalDesc);
        }

        const descElement = document.createElementNS('http://www.w3.org/2000/svg', 'desc');

        descElement.innerHTML = description;
        svg.prepend(descElement);
      }

      if (typeof title !== 'undefined') {
        const originalTitle = svg.querySelector('title');

        if (originalTitle?.parentNode) {
          originalTitle.parentNode.removeChild(originalTitle);
        }

        if (title) {
          const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');

          titleElement.innerHTML = title;
          svg.prepend(titleElement);
        }
      }

      return svg;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError = (error: Error | FetchError) => {
    const { onError } = this.props;
    const status =
      error.message === 'Browser does not support SVG' ? STATUS.UNSUPPORTED : STATUS.FAILED;

    if (this.isActive) {
      this.setState({ status }, () => {
        if (typeof onError === 'function') {
          onError(error);
        }
      });
    }
  };

  private handleLoad = (content: string, hasCache = false) => {
    if (this.isActive) {
      this.setState(
        {
          content,
          isCached: hasCache,
          status: STATUS.LOADED,
        },
        this.getElement,
      );
    }
  };

  private load() {
    if (this.isActive) {
      this.setState(
        {
          content: '',
          element: null,
          isCached: false,
          status: STATUS.LOADING,
        },
        async () => {
          const { cacheRequests, fetchOptions, src } = this.props;

          const dataURI = /^data:image\/svg[^,]*?(;base64)?,(.*)/u.exec(src);
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

          try {
            if (cacheRequests) {
              const content = await cacheStore.get(src, fetchOptions);

              this.handleLoad(content, true);
            } else {
              await this.fetchContent();
            }
          } catch (error: any) {
            this.handleError(error);
          }
        },
      );
    }
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
      linkAttributes.includes(name) && (value ? !value.includes('#') : false);

    if (!uniquifyIDs) {
      return node;
    }

    [...node.children].forEach(d => {
      if (d.attributes?.length) {
        const attributes = Object.values(d.attributes).map(a => {
          const attribute = a;
          const match = /url\((.*?)\)/.exec(a.value);

          if (match?.[1]) {
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

    if (([STATUS.UNSUPPORTED, STATUS.FAILED] as Status[]).includes(status)) {
      return children;
    }

    return loader;
  }
}

export default function InlineSVG(props: Props) {
  if (!cacheStore) {
    cacheStore = new CacheStore();
  }

  const { loader } = props;
  const hasCallback = React.useRef(false);
  const [isReady, setReady] = React.useState(cacheStore.isReady);

  React.useEffect(() => {
    if (!hasCallback.current) {
      cacheStore.onReady(() => {
        setReady(true);
      });

      hasCallback.current = true;
    }
  }, []);

  if (!isReady) {
    return loader;
  }

  return <ReactInlineSVG {...props} />;
}

export * from './types';
