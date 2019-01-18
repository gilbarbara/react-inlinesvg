import React from 'react';
import PropTypes from 'prop-types';
import httpplease from 'httpplease';
import ieXDomain from 'httpplease/plugins/oldiexdomain';

import {
  configurationError,
  isSupportedEnvironment,
  randomString, uniquifySVGIDs,
  unsupportedBrowserError,
} from './utils';

const http = httpplease.use(ieXDomain);

const Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

const getRequestsByUrl = {};
const loadedIcons = {};

export default class InlineSVG extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      status: Status.PENDING
    };

    this.isActive = false;
  }

  static propTypes = {
    baseURL: PropTypes.string,
    cacheGetRequests: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    preloader: PropTypes.node,
    processSVG: PropTypes.func,
    src: PropTypes.string.isRequired,
    style: PropTypes.object,
    supportTest: PropTypes.func,
    uniqueHash: PropTypes.string,
    uniquifyIDs: PropTypes.bool,
    wrapper: PropTypes.func,
  };

  static defaultProps = {
    baseURL: '',
    cacheGetRequests: false,
    onLoad: () => {},
    supportTest: isSupportedEnvironment,
    uniquifyIDs: true,
    wrapper: React.createFactory('span'),
  };

  componentWillMount() {
    this.isActive = true;
  }

  componentDidMount() {
    const { status } = this.state;
    const { src, supportTest } = this.props;

    /* istanbul ignore else */
    if (status === Status.PENDING) {
      if (supportTest()) {
        if (src) {
          this.startLoad();
          return;
        }

        this.fail(configurationError('Missing source'));
        return;
      }

      this.fail(unsupportedBrowserError());
    }
  }

  componentDidUpdate(prevProps) {
    const { src } = this.props;

    if (prevProps.src !== src) {
      if (src) {
        this.startLoad();
        return;
      }

      this.fail(configurationError('Missing source'));
    }
  }

  componentWillUnmount() {
    this.isActive = false;
  }

  getFile(callback) {
    const { cacheGetRequests, src } = this.props;

    if (cacheGetRequests) {
      if (loadedIcons[src]) {
        const [err, res] = loadedIcons[src];

        callback(err, res, true);
      }

      if (!getRequestsByUrl[src]) {
        getRequestsByUrl[src] = [];

        http.get(src, (err, res) => {
          getRequestsByUrl[src].forEach(cb => {
            const { src: currentSrc } = this.props;
            loadedIcons[src] = [err, res];

            if (src === currentSrc) {
              cb(err, res);
            }
          });
        });
      }

      getRequestsByUrl[src].push(callback);
    }
    else {
      http.get(src, (err, res) => {
        const { src: currentSrc } = this.props;

        if (src === currentSrc) {
          callback(err, res);
        }
      });
    }
  }

  fail(error) {
    const { onError } = this.props;
    const status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

    /* istanbul ignore else */
    if (this.isActive) {
      this.setState({ status }, () => {
        if (typeof onError === 'function') {
          onError(error);
        }
      });
    }
  }

  startLoad() {
    /* istanbul ignore else */
    if (this.isActive) {
      this.setState({
        status: Status.LOADING
      }, this.load);
    }
  }

  load() {
    const { src } = this.props;
    const match = src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);

    if (match) {
      return this.handleLoad(null, {
        text: match[1] ? atob(match[2]) : decodeURIComponent(match[2])
      });
    }

    return this.getFile(this.handleLoad);
  }

  handleLoad = (err, res, isCached = false) => {
    const { onLoad, src } = this.props;
    if (err) {
      this.fail(err);
      return;
    }

    if (this.isActive) {
      this.setState({
        loadedText: res.text,
        status: Status.LOADED
      }, () => {
        onLoad(src, isCached);
      });
    }
  };

  getClassName() {
    const { status } = this.state;
    const { className } = this.props;
    let nextClassName = `isvg ${status}`;

    if (className) {
      nextClassName += ` ${className}`;
    }

    return nextClassName;
  }

  processSVG(text) {
    const {
      uniquifyIDs,
      uniqueHash,
      baseURL,
      processSVG
    } = this.props;

    let svgText = text;
    if (processSVG) {
      svgText = processSVG(svgText);
    }

    if (uniquifyIDs) {
      return uniquifySVGIDs(svgText, uniqueHash || randomString(), baseURL);
    }

    return svgText;
  }

  renderContents() {
    const { status } = this.state;
    const { children, preloader } = this.props;

    switch (status) {
      case Status.UNSUPPORTED:
      case Status.FAILED:
        return children;
      default:
        return preloader;
    }
  }

  render() {
    const { loadedText } = this.state;
    const { style, wrapper } = this.props;
    let content;
    let html;

    if (loadedText) {
      html = {
        __html: this.processSVG(loadedText)
      };
    }
    else {
      content = this.renderContents();
    }

    return wrapper({
      style,
      className: this.getClassName(),
      dangerouslySetInnerHTML: html,
    }, content);
  }
}
