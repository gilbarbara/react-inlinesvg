'use strict';

exports.__esModule = true;
exports.configurationError = exports.unsupportedBrowserError = exports.uniquifySVGIDs = exports.randomString = exports.isSupportedEnvironment = exports.supportsInlineSVG = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const supportsInlineSVG = exports.supportsInlineSVG = (0, _once2.default)(() => {
  /* istanbul ignore next */
  if (!document) {
    return false;
  }

  const div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

const isSupportedEnvironment = exports.isSupportedEnvironment = (0, _once2.default)(() => ((typeof window !== 'undefined' && window !== null ? window.XMLHttpRequest : false) || (typeof window !== 'undefined' && window !== null ? window.XDomainRequest : false)) && supportsInlineSVG());

const randomString = exports.randomString = (length = 8) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '1234567890';
  const charset = letters + letters.toUpperCase() + numbers;

  const randomCharacter = array => array[Math.floor(Math.random() * array.length)];

  let R = '';
  for (let i = 0; i < length; i++) {
    R += randomCharacter(charset);
  }
  return R;
};

const uniquifySVGIDs = exports.uniquifySVGIDs = (() => {
  const mkAttributePattern = attr => `(?:(?:\\s|\\:)${attr})`;

  const idPattern = new RegExp(`(?:(${mkAttributePattern('id')})="([^"]+)")|(?:(${mkAttributePattern('href')}|${mkAttributePattern('role')}|${mkAttributePattern('arcrole')})="\\#([^"]+)")|(?:="url\\(\\#([^\\)]+)\\)")`, 'g');

  return (svgText, svgID) => {
    const uniquifyID = id => `${id}___${svgID}`;

    return svgText.replace(idPattern, (m, p1, p2, p3, p4, p5) => {
      //eslint-disable-line consistent-return
      /* istanbul ignore else */
      if (p2) {
        return `${p1}="${uniquifyID(p2)}"`;
      } else if (p4) {
        return `${p3}="#${uniquifyID(p4)}"`;
      } else if (p5) {
        return `="url(#${uniquifyID(p5)})"`;
      }
    });
  };
})();

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

  return _extends({}, err, attrs);
};

const unsupportedBrowserError = exports.unsupportedBrowserError = message => {
  let newMessage = message;

  /* istanbul ignore else */
  if (!newMessage) {
    newMessage = 'Unsupported Browser';
  }

  return createError(newMessage, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

const configurationError = exports.configurationError = message => createError(message, {
  isConfigurationError: true
});