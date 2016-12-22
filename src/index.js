import React from 'react';
import once from 'once';
import httpplease from 'httpplease';
import ieXDomain from 'httpplease/plugins/oldiexdomain';

import { shouldComponentUpdate } from './shouldComponentUpdate';

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

const createGetOrUseCacheForUrl = (context, url, requestFunction, callback) => {
  if (loadedIcons[url]) {
    const params = loadedIcons[url];

    context._pendingTimeout = setTimeout(() => {
      context._pendingTimeout = null;
      callback(params[0], params[1]);
    }, 0);
  }

  if (!getRequestsByUrl[url]) {
    getRequestsByUrl[url] = [];

    context._pendingRequest = requestFunction(url, (err, svgText) => {
      getRequestsByUrl[url].forEach(cb => {
        loadedIcons[url] = [err, svgText];
        cb(err, svgText);
      });
    });
  }

  getRequestsByUrl[url].push(callback);
};

const supportsInlineSVG = once(() => {
  if (!document) {
    return false;
  }

  const div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

const isSupportedEnvironment = once(() =>
  (
    (typeof window !== 'undefined' && window !== null ? window.XMLHttpRequest : false) ||
    (typeof window !== 'undefined' && window !== null ? window.XDomainRequest : false)
  ) &&
  supportsInlineSVG()
);

const uniquifyIDs = (() => {
  const mkAttributePattern = attr => `(?:(?:\\s|\\:)${attr})`;

  const idPattern = new RegExp(`(?:(${(mkAttributePattern('id'))})="([^"]+)")|(?:(${(mkAttributePattern('href'))}|${(mkAttributePattern('role'))}|${(mkAttributePattern('arcrole'))})="\\#([^"]+)")|(?:="url\\(\\#([^\\)]+)\\)")`, 'g');

  return (svgText, svgID) => {
    const uniquifyID = id => `${id}___${svgID}`;

    return svgText.replace(idPattern, (m, p1, p2, p3, p4, p5) => { //eslint-disable-line consistent-return
      if (p2) {
        return `${p1}="${(uniquifyID(p2))}"`;
      }
      else if (p4) {
        return `${p3}="#${(uniquifyID(p4))}"`;
      }
      else if (p5) {
        return `="url(#${(uniquifyID(p5))})"`;
      }
    });
  };
})();

const getHash = str => {
  let chr;
  let hash = 0;
  let i;
  let j;
  let ref;

  if (!str) {
    return hash;
  }

  for (i = j = 0, ref = str.length; ref >= 0 ? j < ref : j > ref; i = ref >= 0 ? ++j : --j) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash &= hash;
  }

  return hash;
};

class InlineSVGError extends Error {
  constructor(message) {
    super();

    this.name = 'InlineSVGError';
    this.isSupportedBrowser = true;
    this.isConfigurationError = false;
    this.isUnsupportedBrowserError = false;
    this.message = message;

    return this;
  }
}

const createError = (message, attrs) => {
  const err = new InlineSVGError(message);

  Object.keys(attrs).forEach(k => {
    err[k] = attrs[k];
  });

  return err;
};

const unsupportedBrowserError = message => {
  let newMessage = message;

  if (newMessage === null) {
    newMessage = 'Unsupported Browser';
  }

  return createError(newMessage, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

const configurationError = message => createError(message, {
  isConfigurationError: true
});

export default class InlineSVG extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: Status.PENDING
    };

    this.handleLoad = this.handleLoad.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
  }

  static propTypes = {
    cacheGetRequests: React.PropTypes.bool,
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    onError: React.PropTypes.func,
    onLoad: React.PropTypes.func,
    preloader: React.PropTypes.func,
    src: React.PropTypes.string.isRequired,
    supportTest: React.PropTypes.func,
    uniquifyIDs: React.PropTypes.bool,
    wrapper: React.PropTypes.func,
    requestFunction: React.PropTypes.func
  };

  static defaultRequestFunction = function XHRRequest(src, cb){
    return http.get(src, (err, res) => {
      if(err){
        cb(err);
      }
      else{
        const svgText = res.text
        cb(svgText);
      }
    });
  }

  static defaultProps = {
    wrapper: React.DOM.span,
    supportTest: isSupportedEnvironment,
    uniquifyIDs: true,
    cacheGetRequests: false
  };

  shouldComponentUpdate = shouldComponentUpdate;

  componentWillUnmount() {
    //Abort pending request to prevent an error if the request completes after the component is unmounted
    this._abortPendingRequest = true
    if (this._pendingRequest) {
      if(this._pendingRequest.abort){
        this._pendingRequest.abort();
      }
    }
    if (this._pendingTimeout) {
      clearTimeout(this._pendingTimeout)
    }
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

  makeRequest(src, cb){
    const requestFunction = this.props.requestFunction || InlineSVG.defaultRequestFunction
    return requestFunction(src, cb)
  }

  fail(error) {
    const status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

    this.setState({ status }, () => {
      if (typeof this.props.onError === 'function') {
        this.props.onError(error);
      }
    });
  }

  handleLoad(err, svgText) {
    this._pendingRequest = null;

    if(!err && this._abortPendingRequest){
      err = new Error('Aborted svg loading.');
      err.name = 'Abort';
    }

    if (err) {
      if (err.name !== 'Abort') {
        this.fail(err);
      }

      return;
    }

    this.setState({
      svgText,
      status: Status.LOADED
    }, () => (typeof this.props.onLoad === 'function' ? this.props.onLoad() : null));
  }

  startLoad() {
    this.setState({
      status: Status.LOADING
    }, this.load);
  }

  load() {
    const match = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
    if (match) {
      const svgText = match[1] ? atob(match[2]) : decodeURIComponent(match[2]);
      return this.handleLoad(null, svgText);
    }

    if (this.props.cacheGetRequests) {
      return createGetOrUseCacheForUrl(
        this,
        this.props.src,
        this.makeRequest,
        this.handleLoad
      );
    }

    return this._pendingRequest = this.makeRequest(this.props.src, this.handleLoad);
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
      className: this.getClassName(),
      dangerouslySetInnerHTML: this.state.svgText ? {
        __html: this.processSVG(this.state.svgText)
      } : undefined
    }, this.renderContents());
  }
}
