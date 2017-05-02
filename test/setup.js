import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:1337' });

global.document = window.document;
global.window = window;
global.navigator = { userAgent: 'node.js' };
global.atob = window.atob;
