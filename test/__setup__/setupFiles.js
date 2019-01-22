import Enzyme, { shallow, mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import fetch from 'node-fetch';

Enzyme.configure({ adapter: new Adapter() });

global.fetch = fetch;
global.shallow = shallow;
global.mount = mount;
global.render = render;

const react = document.createElement('div');
react.id = 'react';
react.style.height = '100vh';
document.body.appendChild(react);

window.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

window.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
});
