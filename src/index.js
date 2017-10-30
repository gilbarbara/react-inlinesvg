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

const createGetOrUseCacheForUrl = (url, callback) => {
  if (loadedIcons[url]) {
    const params = loadedIcons[url];

    setTimeout(() => callback(params[0], params[1]), 0);
  }

  if (!getRequestsByUrl[url]) {
    getRequestsByUrl[url] = [];

    http.get(url, (err, res) => {
      getRequestsByUrl[url].forEach(cb => {
        loadedIcons[url] = [err, res];
        cb(err, res);
      });
    });
  }

  getRequestsByUrl[url].push(callback);
};
export default class InlineSVG extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      status: Status.PENDING
    };

    this.handleLoad = this.handleLoad.bind(this);
    this.isActive = false;
  }

  static propTypes = {
    cacheGetRequests: PropTypes.bool,
    children: PropTypes.node,
    className: PropTypes.string,
    onError: PropTypes.func,
    onLoad: PropTypes.func,
    preloader: PropTypes.func,
    src: PropTypes.string.isRequired,
    style: PropTypes.object,
    supportTest: PropTypes.func,
    uniquifyIDs: PropTypes.bool,
    wrapper: PropTypes.func
  };

  static defaultProps = {
    wrapper: React.createFactory('span'),
    supportTest: isSupportedEnvironment,
    uniquifyIDs: true,
    cacheGetRequests: false
  };

  componentWillMount() {
    this.isActive = true;
  }

  componentDidMount() {
    if (this.state.status === Status.PENDING) {
      if (this.props.supportTest()) {
        if (this.props.src) {
          this.startLoad();
        }
        else {
          this.fail(configurationError('Missing source'));
        }
      }
      else {
        this.fail(unsupportedBrowserError());
      }
    }
  }

  componentWillUnmount() {
    this.isActive = false;
  }

  fail(error) {
    const status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

    if (this.isActive) {
      this.setState({ status }, () => {
        if (typeof this.props.onError === 'function') {
          this.props.onError(error);
        }
      });
    }
  }

  handleLoad(err, res) {
    if (err) {
      this.fail(err);
      return;
    }

    if (this.isActive) {
      this.setState({
        loadedText: res.text,
        status: Status.LOADED
      }, () => (typeof this.props.onLoad === 'function' ? this.props.onLoad() : null));
    }
  }

  startLoad() {
    if (this.isActive) {
      this.setState({
        status: Status.LOADING
      }, this.load);
    }
  }

  load() {
    const match = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
    if (match) {
      return this.handleLoad(null, {
        text: match[1] ? atob(match[2]) : decodeURIComponent(match[2])
      });
    }
    if (this.props.cacheGetRequests) {
      return createGetOrUseCacheForUrl(
        this.props.src,
        this.handleLoad
      );
    }

    return http.get(this.props.src, this.handleLoad);
  }

  getClassName() {
    let className = `isvg ${this.state.status}`;

    if (this.props.className) {
      className += ` ${this.props.className}`;
    }

    return className;
  }

  processSVG(svgText) {
    if (this.props.uniquifyIDs) {
      return uniquifyIDs(svgText, getHash(this.props.src));
    }

    return svgText;
  }

  renderContents() {
    switch (this.state.status) {
      case Status.UNSUPPORTED:
      case Status.FAILED:
        return this.props.children;
      default:
        return this.props.preloader;
    }
  }

  render() {
    return this.props.wrapper({
      style: this.props.style,
      className: this.getClassName(),
      dangerouslySetInnerHTML: this.state.loadedText ? {
        __html: this.processSVG(this.state.loadedText)
      } : undefined
    }, this.renderContents());
  }
}
