import jsdom from 'jsdom';

const doc = jsdom.jsdom('<!doctype html><html><body></body></html>', { url: 'http://localhost:1337' });
const win = doc.defaultView; // get the window object out of the document

global.document = doc;
global.window = win;
global.window.matchMedia = () => ({ matches: true });
global.navigator = { userAgent: 'node.js' };

// from mocha-jsdom https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
function propagateToGlobal(window) {
  for (const key in window) {
    if (!window.hasOwnProperty(key)) {
      continue;
    }
    if (key in global) {
      continue;
    }

    global[key] = window[key];
  }
}

propagateToGlobal(win);
