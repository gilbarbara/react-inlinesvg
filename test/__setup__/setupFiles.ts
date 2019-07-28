/* tslint:disable:no-console */
declare var window: any;

import Enzyme from 'enzyme';
// @ts-ignore
import Adapter from 'enzyme-adapter-react-16';
import fetch from 'node-fetch';

import { InlineSVGError } from '../../src/helpers';

Enzyme.configure({ adapter: new Adapter() });

window.fetch = fetch;

const react = document.createElement('div');
react.id = 'react';
react.style.height = '100vh';
document.body.appendChild(react);

window.skipEventLoop = () => new Promise(resolve => setImmediate(resolve));

window.requestAnimationFrame = (callback: () => void) => {
  setTimeout(callback, 0);
};

window.matchMedia = () => ({
  addListener: () => undefined,
  matches: false,
  removeListener: () => undefined,
});

const consoleError = console.error;
console.error = jest.fn(error => {
  const skipMessages = ['Expected `%s` listener', 'Error parsing input'];

  if (
    (typeof error === 'string' && skipMessages.some(d => error.indexOf(d) >= 0)) ||
    (error instanceof Error &&
      (error.name === 'InlineSVGError' || skipMessages.some(d => error.message.indexOf(d) >= 0)))
  ) {
    return;
  }

  consoleError(error);
});
