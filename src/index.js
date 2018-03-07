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
    /* istanbul ignore else */
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

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      if (this.props.src) {
        this.startLoad();
      }
      else {
        this.fail(configurationError('Missing source'));
      }
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
            loadedIcons[src] = [err, res];

            if (src === this.props.src) {
              cb(err, res);
            }
          });
        });
      }

      getRequestsByUrl[src].push(callback);
    }
    else {
      http.get(src, (err, res) => {
        if (src === this.props.src) {
          callback(err, res);
        }
      });
    }
  }

  fail(error) {
    const status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

    /* istanbul ignore else */
    if (this.isActive) {
      this.setState({ status }, () => {
        if (typeof this.props.onError === 'function') {
          this.props.onError(error);
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
    const match = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);

    if (match) {
      return this.handleLoad(null, {
        text: match[1] ? atob(match[2]) : decodeURIComponent(match[2])
      });
    }

    return this.getFile(this.handleLoad);
  }

  handleLoad = (err, res, isCached = false) => {
    if (err) {
      this.fail(err);
      return;
    }

    if (this.isActive) {
      this.setState({
        loadedText: res.text,
        status: Status.LOADED
      }, () => {
        this.props.onLoad(this.props.src, isCached);
      });
    }
  };

  getClassName() {
    let className = `isvg ${this.state.status}`;

    if (this.props.className) {
      className += ` ${this.props.className}`;
    }

    return className;
  }

  processSVG(svgText) {
    const { uniquifyIDs, uniqueHash, baseURL } = this.props;

    if (uniquifyIDs) {
      return uniquifySVGIDs(svgText, uniqueHash || randomString(), baseURL);
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
    let content;
    let html;

    if (this.state.loadedText) {
      html = {
        __html: this.processSVG(this.state.loadedText)
      };
    }
    else {
      content = this.renderContents();
    }

    return this.props.wrapper({
      style: this.props.style,
      className: this.getClassName(),
      dangerouslySetInnerHTML: html,
    }, content);
  }
}
