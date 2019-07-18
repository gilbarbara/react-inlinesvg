import Enzyme, { shallow, mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import fetch from 'node-fetch';

import { InlineSVGError } from '../../src/helpers.ts';

Enzyme.configure({ adapter: new Adapter() });

global.act = act;
global.fetch = fetch;
global.shallow = shallow;
global.mount = mount;
global.render = render;

const react = document.createElement('div');
react.id = 'react';
react.style.height = '100vh';
document.body.appendChild(react);

window.skipEventLoop = () => new Promise(resolve => setImmediate(resolve));

window.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

window.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
});

const consoleError = console.error;
console.error = jest.fn(message => {
  if (message instanceof InlineSVGError) {
    return;
  }

  consoleError(message);
});
