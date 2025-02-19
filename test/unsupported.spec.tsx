import * as React from 'react';
import { render, waitFor } from '@testing-library/react';

import InlineSVG, { Props } from '../src';

declare let window: any;

const mockOnError = vi.fn();
const mockOnLoad = vi.fn();

let mockCanUseDOM = false;
let mockIsSupportedEnvironment = true;

vi.mock('../src/modules/helpers', async () => {
  const utils = await vi.importActual<Record<string, () => any>>('../src/modules/helpers');

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

    const { container } = setup();

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(new TypeError('fetch is not a function'));
    });

    expect(container.firstChild).toMatchSnapshot();

    window.fetch = globalFetch;
  });

  it("shouldn't not render anything if is an unsupported browser", () => {
    mockCanUseDOM = true;
    mockIsSupportedEnvironment = false;

    const { container } = setup();

    expect(mockOnError).toHaveBeenCalledWith(new Error('Browser does not support SVG'));
    expect(container.firstChild).toMatchSnapshot();
  });
});
