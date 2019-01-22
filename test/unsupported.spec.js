import React from 'react';
import { InlineSVGError } from '../src/utils';

const fixtures = {
  play: 'http://localhost:1337/play.svg',
};

const mockOnError = jest.fn();
let mockCanUseDOM = false;
let mockIsSupportedEnvironment = true;

jest.mock('../src/utils', () => {
  const utils = require.requireActual('../src/utils');

  return {
    ...utils,
    canUseDOM: () => mockCanUseDOM,
    isSupportedEnvironment: () => mockIsSupportedEnvironment,
  };
});

function setup({ onLoad, ...rest }) {
  // eslint-disable-next-line global-require
  const ReactInlineSVG = require('../src').default;

  return new Promise(resolve => {
    const wrapper = mount(<ReactInlineSVG
      onLoad={(src, isCached) => {
        setTimeout(() => {
          if (onLoad) onLoad(src, isCached);

          resolve(wrapper);
        }, 0);
      }}
      onError={error => {
        mockOnError(error);
        setTimeout(() => resolve(wrapper), 0);
      }}
      {...rest}
    />);

    return wrapper;
  });
}

describe('unsupported environments', () => {
  it('shouldn\'t break without DOM ', async() => {
    const wrapper = await setup({
      src: fixtures.play,
    });

    expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('No DOM'));
    expect(wrapper).toMatchSnapshot();

    //  expect(wrapper.state('content')).toBe(fixtures.play);
  });

  xit('should warn the user if fetch is missing', () => {

  });

  it('shouldn\'t not render anything if is an unsupported browser', async() => {
    mockCanUseDOM = true;
    mockIsSupportedEnvironment = false;

    const wrapper = await setup({
      src: fixtures.play,
    });

    expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('Browser does not support SVG'));
    expect(wrapper).toMatchSnapshot();
  });
});
