import * as React from 'react';
import { render } from '@testing-library/react';

import InlineSVG, { Props } from '../src';

declare let window: any;

const mockOnError = jest.fn();
const mockOnLoad = jest.fn();

let mockCanUseDOM = false;
let mockIsSupportedEnvironment = true;

jest.mock('../src/helpers', () => {
  const utils = jest.requireActual('../src/helpers');

  return {
    ...utils,
    canUseDOM: () => mockCanUseDOM,
    isSupportedEnvironment: () => mockIsSupportedEnvironment,
  };
});

function Loader() {
  return <div id="loader" />;
}

function setup({ onLoad, src = 'http://localhost:1337/play.svg', ...rest }: Partial<Props> = {}) {
  return render(
    <InlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src={src} {...rest} />,
  );
}

describe('unsupported environments', () => {
  it("shouldn't break without DOM", async () => {
    const { container, rerender } = setup();

    expect(mockOnLoad).not.toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
    expect(container.firstChild).toMatchSnapshot();

    rerender(<InlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src="" />);
  });

  it('should warn the user if fetch is missing', async () => {
    const globalFetch = fetch;

    window.fetch = undefined;

    mockCanUseDOM = true;
    mockIsSupportedEnvironment = true;

    const { container } = await setup();

    expect(mockOnError).toHaveBeenCalledWith(new Error('fetch is not a function'));
    expect(container.firstChild).toMatchSnapshot();

    window.fetch = globalFetch;
  });

  it("shouldn't not render anything if is an unsupported browser", async () => {
    mockCanUseDOM = true;
    mockIsSupportedEnvironment = false;

    const { container } = await setup();

    expect(mockOnError).toHaveBeenCalledWith(new Error('Browser does not support SVG'));
    expect(container.firstChild).toMatchSnapshot();
  });
});
