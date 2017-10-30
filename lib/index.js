'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var http = _httpplease2.default.use(_oldiexdomain2.default);

var Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

var getRequestsByUrl = {};
var loadedIcons = {};

var InlineSVG = function (_React$PureComponent) {
  _inherits(InlineSVG, _React$PureComponent);

  function InlineSVG(props) {
    _classCallCheck(this, InlineSVG);

    var _this = _possibleConstructorReturn(this, (InlineSVG.__proto__ || Object.getPrototypeOf(InlineSVG)).call(this, props));

    _this.handleLoad = function (err, res) {
      var isCached = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (err) {
        _this.fail(err);
        return;
      }

      if (_this.isActive) {
        _this.setState({
          loadedText: res.text,
          status: Status.LOADED
        }, function () {
          _this.props.onLoad(_this.props.src, isCached);
        });
      }
    };

    _this.state = {
      status: Status.PENDING
    };

    _this.isActive = false;
    return _this;
  }

  _createClass(InlineSVG, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.isActive = true;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
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
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps) {
      if (prevProps.src !== this.props.src) {
        if (this.props.src) {
          this.startLoad();
        } else {
          this.fail((0, _utils.configurationError)('Missing source'));
        }
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.isActive = false;
    }
  }, {
    key: 'getFile',
    value: function getFile(callback) {
      var _props = this.props,
          cacheGetRequests = _props.cacheGetRequests,
          src = _props.src;


      if (cacheGetRequests) {
        if (loadedIcons[src]) {
          var _loadedIcons$src = _slicedToArray(loadedIcons[src], 2),
              err = _loadedIcons$src[0],
              res = _loadedIcons$src[1];

          setTimeout(function () {
            return callback(err, res, true);
          }, 0);
        }

        if (!getRequestsByUrl[src]) {
          getRequestsByUrl[src] = [callback];

          http.get(src, function (err, res) {
            getRequestsByUrl[src].forEach(function (cb) {
              loadedIcons[src] = [err, res];
              cb(err, res);
            });
          });
        }
      } else {
        http.get(src, function (err, res) {
          callback(err, res);
        });
      }
    }
  }, {
    key: 'fail',
    value: function fail(error) {
      var _this2 = this;

      var status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

      /* istanbul ignore else */
      if (this.isActive) {
        this.setState({ status: status }, function () {
          if (typeof _this2.props.onError === 'function') {
            _this2.props.onError(error);
          }
        });
      }
    }
  }, {
    key: 'startLoad',
    value: function startLoad() {
      /* istanbul ignore else */
      if (this.isActive) {
        this.setState({
          status: Status.LOADING
        }, this.load);
      }
    }
  }, {
    key: 'load',
    value: function load() {
      var match = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);

      if (match) {
        return this.handleLoad(null, {
          text: match[1] ? atob(match[2]) : decodeURIComponent(match[2])
        });
      }

      return this.getFile(this.handleLoad);
    }
  }, {
    key: 'getClassName',
    value: function getClassName() {
      var className = 'isvg ' + this.state.status;

      if (this.props.className) {
        className += ' ' + this.props.className;
      }

      return className;
    }
  }, {
    key: 'processSVG',
    value: function processSVG(svgText) {
      var _props2 = this.props,
          uniquifyIDs = _props2.uniquifyIDs,
          uniqueHash = _props2.uniqueHash;


      if (uniquifyIDs) {
        return (0, _utils.uniquifySVGIDs)(svgText, uniqueHash);
      }

      return svgText;
    }
  }, {
    key: 'renderContents',
    value: function renderContents() {
      switch (this.state.status) {
        case Status.UNSUPPORTED:
        case Status.FAILED:
          return this.props.children;
        default:
          return this.props.preloader;
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var content = void 0;
      var html = void 0;

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
  }]);

  return InlineSVG;
}(_react2.default.PureComponent);

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
  onLoad: function onLoad() {},
  supportTest: _utils.isSupportedEnvironment,
  uniquifyIDs: true,
  uniqueHash: (0, _utils.randomString)(),
  wrapper: _react2.default.createFactory('span')
};
exports.default = InlineSVG;
module.exports = exports['default'];