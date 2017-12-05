'use strict';

exports.__esModule = true;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _httpplease = require('httpplease');

var _httpplease2 = _interopRequireDefault(_httpplease);

var _oldiexdomain = require('httpplease/plugins/oldiexdomain');

var _oldiexdomain2 = _interopRequireDefault(_oldiexdomain);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const http = _httpplease2.default.use(_oldiexdomain2.default);

const Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

const getRequestsByUrl = {};
const loadedIcons = {};

class InlineSVG extends _react2.default.PureComponent {
  constructor(props) {
    super(props);

    this.handleLoad = (err, res, isCached = false) => {
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

    this.state = {
      status: Status.PENDING
    };

    this.isActive = false;
  }

  componentWillMount() {
    this.isActive = true;
  }

  componentDidMount() {
    /* istanbul ignore else */
    if (this.state.status === Status.PENDING) {
      if (this.props.supportTest()) {
        if (this.props.src) {
          this.startLoad();
        } else {
          this.fail((0, _utils.configurationError)('Missing source'));
        }
      } else {
        this.fail((0, _utils.unsupportedBrowserError)());
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      if (this.props.src) {
        this.startLoad();
      } else {
        this.fail((0, _utils.configurationError)('Missing source'));
      }
    }
  }

  componentWillUnmount() {
    this.isActive = false;
  }

  getFile(callback) {
    var _props = this.props;
    const cacheGetRequests = _props.cacheGetRequests,
          src = _props.src;


    if (cacheGetRequests) {
      if (loadedIcons[src]) {
        var _loadedIcons$src = _slicedToArray(loadedIcons[src], 2);

        const err = _loadedIcons$src[0],
              res = _loadedIcons$src[1];


        setTimeout(() => callback(err, res, true), 0);
      }

      if (!getRequestsByUrl[src]) {
        getRequestsByUrl[src] = [];

        http.get(src, (err, res) => {
          getRequestsByUrl[src].forEach(cb => {
            loadedIcons[src] = [err, res];
            cb(err, res);
          });
        });
      }

      getRequestsByUrl[src].push(callback);
    } else {
      http.get(src, (err, res) => {
        callback(err, res);
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

  getClassName() {
    let className = `isvg ${this.state.status}`;

    if (this.props.className) {
      className += ` ${this.props.className}`;
    }

    return className;
  }

  processSVG(svgText) {
    var _props2 = this.props;
    const uniquifyIDs = _props2.uniquifyIDs,
          uniqueHash = _props2.uniqueHash;


    if (uniquifyIDs) {
      return (0, _utils.uniquifySVGIDs)(svgText, uniqueHash);
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
    } else {
      content = this.renderContents();
    }

    return this.props.wrapper({
      style: this.props.style,
      className: this.getClassName(),
      dangerouslySetInnerHTML: html
    }, content);
  }
}
exports.default = InlineSVG;
InlineSVG.propTypes = {
  cacheGetRequests: _propTypes2.default.bool,
  children: _propTypes2.default.node,
  className: _propTypes2.default.string,
  onError: _propTypes2.default.func,
  onLoad: _propTypes2.default.func,
  preloader: _propTypes2.default.node,
  src: _propTypes2.default.string.isRequired,
  style: _propTypes2.default.object,
  supportTest: _propTypes2.default.func,
  uniqueHash: _propTypes2.default.string,
  uniquifyIDs: _propTypes2.default.bool,
  wrapper: _propTypes2.default.func
};
InlineSVG.defaultProps = {
  cacheGetRequests: false,
  onLoad: () => {},
  supportTest: _utils.isSupportedEnvironment,
  uniquifyIDs: true,
  uniqueHash: (0, _utils.randomString)(),
  wrapper: _react2.default.createFactory('span')
};