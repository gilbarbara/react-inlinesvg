import { configure } from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import fetch from 'node-fetch';

declare let window: any;

export {};

configure({ adapter: new Adapter() });

window.fetch = fetch;

const react = document.createElement('div');
react.id = 'react';
react.style.height = '100vh';
document.body.appendChild(react);

window.skipEventLoop = () => new Promise((resolve) => setImmediate(resolve));

window.requestAnimationFrame = (callback: () => void) => {
  setTimeout(callback, 0);
};

window.matchMedia = () => ({
  addListener: () => undefined,
  matches: false,
  removeListener: () => undefined,
});

const consoleError = console.error;
console.error = jest.fn((...args) => {
  const [error] = args;
  const skipMessages = [
    'Browser does not support SVG',
    "Content type isn't valid",
    'Could not convert the src',
    'Error parsing input',
    'Expected `%s` listener',
    'fetch is not a function',
    'Missing src',
    'Not found',
  ];

  if (!skipMessages.some((d) => error.toString().includes(d))) {
    consoleError(...args);
  }
});
