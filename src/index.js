/* eslint-disable no-underscore-dangle */
import React from 'react';
import PropTypes from 'prop-types';
import DomToReact from 'dom-to-react';

import {
  canUseDOM,
  InlineSVGError,
  isSupportedEnvironment,
  randomString,
} from './utils';

const STATUS = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  READY: 'ready',
  UNSUPPORTED: 'unsupported'
};

export const storage = [];

export default class InlineSVG extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      content: '',
      element: null,
      hasCache: props.cacheRequests && !!storage.find(s => s.url === props.src),
      status: STATUS.PENDING
    };

    this._isMounted = false;
  }

  static propTypes = {
    baseURL: PropTypes.string,
    cacheRequests: PropTypes.bool,
    children: PropTypes.node,
    description: PropTypes.string,
    loader: PropTypes.node,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    preProcessor: PropTypes.func,
    src: PropTypes.string.isRequired,
    title: PropTypes.string,
    uniqueHash: PropTypes.string,
    uniquifyIDs: PropTypes.bool
  };

  static defaultProps = {
    cacheRequests: true,
    onLoad: () => {},
    uniquifyIDs: false
  };

  componentDidMount() {
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
        if (!isSupportedEnvironment()) throw new InlineSVGError('Browser does not support SVG');

        /* istanbul ignore else */
        if (!src) throw new InlineSVGError('Missing src');

        this.load();
      }
    }

    catch (error) {
      this.handleError(error);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!canUseDOM()) return;

    const { hasCache, status } = this.state;
    const { onLoad, src } = this.props;

    if (prevState.status !== STATUS.READY && status === STATUS.READY) {
      onLoad(src, hasCache);
    }

    if (prevProps.src !== src) {
      if (!src) {
        this.handleError(new InlineSVGError('Missing src'));
        return;
      }

      this.load();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  parseSVG() {
    const { content } = this.state;
    const { preProcessor } = this.props;

    if (preProcessor) {
      return preProcessor(content);
    }

    return content;
  }

  updateSVGAttributes(node) {
    const { baseURL = '', uniquifyIDs, uniqueHash } = this.props;
    const replaceableAttributes = [
      'id',
      'href',
      'xlink:href',
      'xlink:role',
      'xlink:arcrole'
    ];

    if (!uniquifyIDs) {
      return node;
    }

    const hash = uniqueHash || randomString();

    [...node.childNodes].forEach(d => {
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

      if (d.childNodes.length) {
        d = this.updateSVGAttributes(d); // eslint-disable-line no-param-reassign
      }
    });

    return node;
  }

  generateNode() {
    const { description, title } = this.props;

    try {
      const svgText = this.parseSVG();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = this.updateSVGAttributes(doc.querySelector('svg'));

      if (description) {
        const originalDesc = svg.querySelector('desc');

        if (originalDesc) {
          originalDesc.innerHTML = description;
        }
        else {
          const descElement = document.createElement('desc');
          descElement.innerHTML = description;
          svg.prepend(descElement);
        }
      }

      if (title) {
        const originalTitle = svg.querySelector('title');

        if (originalTitle) {
          originalTitle.innerHTML = title;
        }
        else {
          const titleElement = document.createElement('title');
          titleElement.innerHTML = title;
          svg.prepend(titleElement);
        }
      }

      return svg;
    }
    catch (error) {
      return this.handleError(error);
    }
  }

  generateElement() {
    const {
      baseURL,
      cacheRequests,
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
          status: STATUS.READY
        });
      }
    }
    catch (error) {
      this.handleError(error);
    }
  }

  load() {
    /* istanbul ignore else */
    if (this._isMounted) {
      this.setState(
        {
          content: '',
          element: null,
          status: STATUS.LOADING
        },
        () => {
          const { cacheRequests, src } = this.props;
          const cache = cacheRequests && storage.find(d => d.url === src);

          if (cache) {
            this.handleLoad(cache.content);
            return;
          }

          const dataURI = src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
          let inlineSrc;

          if (dataURI) {
            inlineSrc = dataURI[1]
              ? atob(dataURI[2])
              : decodeURIComponent(dataURI[2]);
          }
          else if (src.indexOf('<svg') >= 0) {
            inlineSrc = src;
          }

          if (inlineSrc) {
            this.handleLoad(inlineSrc);
            return;
          }

          this.request();
        }
      );
    }
  }

  handleLoad = content => {
    /* istanbul ignore else */
    if (this._isMounted) {
      this.setState(
        {
          content,
          status: STATUS.LOADED
        },
        this.generateElement
      );
    }
  };

  handleError = error => {
    const { onError } = this.props;
    const status = error.message === 'Browser does not support SVG'
      ? STATUS.UNSUPPORTED
      : STATUS.FAILED;

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

  request = () => {
    const { cacheRequests, src } = this.props;

    return fetch(src)
      .then(response => {
        if (response.status > 299) {
          throw new InlineSVGError('request: Not found');
        }

        return response.text();
      })
      .then(content => {
        /* istanbul ignore else */
        if (cacheRequests) {
          storage.push({ url: src, content });
        }

        this.handleLoad(content);
      })
      .catch(error => this.handleError(error));
  };

  render() {
    if (!canUseDOM()) return null;

    const { element, status } = this.state;
    const { children = null, loader = null } = this.props;

    if (element) {
      return element;
    }

    if ([STATUS.UNSUPPORTED, STATUS.FAILED].includes(status)) {
      return children;
    }

    return loader;
  }
}
