/* tslint:disable:jsx-no-lambda */
declare var window: any;
import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import ReactInlineSVG from '../src';
import { InlineSVGError } from '../src/helpers';

const mockOnError = jest.fn();
let mockCanUseDOM = false;
let mockIsSupportedEnvironment = true;

jest.mock('../src/helpers', () => {
  const utils = require.requireActual('../src/helpers');

  return {
    ...utils,
    canUseDOM: () => mockCanUseDOM,
    isSupportedEnvironment: () => mockIsSupportedEnvironment,
  };
});

function setup(): Promise<ReactWrapper> {
  return new Promise(resolve => {
    const wrapper = mount(
      <ReactInlineSVG
        src="http://localhost:1337/play.svg"
        onLoad={() => {
          setTimeout(() => {
            resolve(wrapper);
          }, 0);
        }}
        onError={error => {
          mockOnError(error);
          setTimeout(() => resolve(wrapper), 0);
        }}
      />,
    );

    return wrapper;
  });
}
describe('unsupported environments', () => {
  it("shouldn't break without DOM ", async () => {
    const wrapper = await setup();

    expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('No DOM'));
    expect(wrapper).toMatchSnapshot();
  });

  it('should warn the user if fetch is missing', async () => {
    const globalFetch = fetch;
    window.fetch = undefined;

    mockCanUseDOM = true;
    mockIsSupportedEnvironment = true;

    const wrapper = await setup();

    expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('fetch is not a function'));
    expect(wrapper).toMatchSnapshot();

    window.fetch = globalFetch;
  });

  it("shouldn't not render anything if is an unsupported browser", async () => {
    mockCanUseDOM = true;
    mockIsSupportedEnvironment = false;

    const wrapper = await setup();

    expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('Browser does not support SVG'));
    expect(wrapper).toMatchSnapshot();
  });
});
