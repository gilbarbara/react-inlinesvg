import once from 'once';
import { canUseDOM as canUseDOMBool } from 'exenv';

export const canUseDOM = () => canUseDOMBool;

export const supportsInlineSVG = () => {
  /* istanbul ignore next */
  if (!document) {
    return false;
  }

  const div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
};

export class InlineSVGError extends Error {
  constructor(message, data) {
    super();

    this.name = 'InlineSVGError';
    this.message = message;
    this.data = data;

    return this;
  }
}

export const isSupportedEnvironment = once(() => (
  supportsInlineSVG() && typeof window !== 'undefined' && window !== null
));

export const randomString = (length = 8) => {
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

export const uniquifySVGIDs = (() => {
  const mkAttributePattern = attr => `(?:(?:\\s|\\:)${attr})`;

  const idPattern = new RegExp(`(?:(${(mkAttributePattern('id'))})="([^"]+)")|(?:(${(mkAttributePattern('href'))}|${(mkAttributePattern('role'))}|${(mkAttributePattern('arcrole'))})="#([^"]+)")|(?:="url\\(#([^)]+)\\)")|(?:url\\(#([^)]+)\\))`, 'g');

  return (svgText, svgID, baseURL) => {
    const uniquifyID = id => `${id}___${svgID}`;

    return svgText.replace(idPattern, (m, p1, p2, p3, p4, p5, p6) => { //eslint-disable-line consistent-return
      /* istanbul ignore else */
      if (p2) {
        return `${p1}="${(uniquifyID(p2))}"`;
      }

      if (p4) {
        return `${p3}="${baseURL}#${(uniquifyID(p4))}"`;
      }

      if (p5) {
        return `="url(${baseURL}#${(uniquifyID(p5))})"`;
      }

      if (p6) {
        return `url(${baseURL}#${uniquifyID(p6)})`;
      }
    });
  };
})();
