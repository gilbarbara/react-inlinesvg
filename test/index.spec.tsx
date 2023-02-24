import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';

import ReactInlineSVG, { cacheStore, Props } from '../src/index';

function Loader() {
  return <div id="Loader" />;
}

const fixtures = {
  circles: 'http://127.0.0.1:1337/circles.svg',
  dots: 'http://127.0.0.1:1337/dots.svg',
  icons: 'http://127.0.0.1:1337/icons.svg',
  play: 'http://127.0.0.1:1337/play.svg',
  react: 'http://127.0.0.1:1337/react.svg',
  react_png: 'http://127.0.0.1:1337/react.png',
  tiger: 'http://127.0.0.1:1337/tiger.svg',
  datahref: 'http://127.0.0.1:1337/datahref.svg',
  styles: 'http://127.0.0.1:1337/styles.svg',
  utf8: 'http://127.0.0.1:1337/utf8.svg',
  url: 'https://cdn.svgporn.com/logos/react.svg',
  url2: 'https://cdn.svgporn.com/logos/javascript.svg',
  base64:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  urlEncoded:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
  html: 'data:image/svg+xml,%3Chtml%20lang%3D%22en%22%3E%3Cbody%3EText%3C%2Fbody%3E%3C%2Fhtml%3E',
  string:
    '<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g> <polygon fill="#000000" points="7 5 7 19 18 12"></polygon></g></svg>',
} as const;

const mockOnError = jest.fn();
const mockOnLoad = jest.fn();

function setup({ onLoad, ...rest }: Props) {
  return render(
    <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} {...rest} />,
  );
}

describe('react-inlinesvg', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();

    Object.keys(cacheStore).forEach(d => {
      delete cacheStore[d];
    });
  });

  describe('basic functionality', () => {
    it('should render a base64 src', async () => {
      const { container } = setup({
        src: fixtures.base64,
        title: 'base64',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an urlEncoded src', async () => {
      const { container } = setup({
        src: fixtures.urlEncoded,
        title: 'URL Encoded',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg string src', async () => {
      const { container } = setup({
        src: fixtures.string,
        title: 'String',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an svg url and add title and description', async () => {
      const { container } = setup({
        src: fixtures.react,
        title: 'React FTW',
        description: 'React is a view library',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with mask, gradient and classes', async () => {
      const { container } = setup({
        src: fixtures.dots,
        title: 'Dots',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with external css, style and script', async () => {
      const { container } = setup({
        src: fixtures.circles,
        title: 'Circles',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with inline styles', async () => {
      const { container } = setup({
        src: fixtures.styles,
        uniquifyIDs: true,
        uniqueHash: 'test',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with symbols', async () => {
      const { container } = setup({ src: fixtures.icons });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a svg url with utf-8 characters', async () => {
      const { container } = setup({ src: fixtures.utf8 });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render an svg url and replace existing title and description', async () => {
      const { container } = setup({
        src: fixtures.tiger,
        title: 'The Tiger',
        description: 'Is this a tiger?',
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should render a loader', async () => {
      const { container } = setup({
        src: fixtures.play,
        loader: <Loader />,
      });

      expect(container).toMatchSnapshot();

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle empty src changes', async () => {
      const { container, rerender } = setup({ src: '' });

      expect(container.firstChild).toMatchSnapshot();

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.react}
        />,
      );

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle src changes to empty', async () => {
      const { container, rerender } = setup({ src: fixtures.react });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();

      rerender(
        <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src="" />,
      );

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
      });
    });

    it('should uniquify ids with the random uniqueHash', async () => {
      const { container } = setup({
        src: fixtures.play,
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('radialGradient')?.outerHTML).toEqual(
        expect.stringMatching(/radialGradient-1__.*?/),
      );
    });

    it('should uniquify ids with a custom uniqueHash', async () => {
      const { container } = setup({
        src: fixtures.play,
        uniqueHash: 'test',
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should prefix the ids with the baseURL', async () => {
      const { container } = setup({
        src: fixtures.play,
        baseURL: 'https://example.com/',
        uniqueHash: 'test',
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should not uniquify non-id hrefs', async () => {
      const { container } = setup({
        src: fixtures.datahref,
        uniquifyIDs: true,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should transform the SVG text with the preProcessor prop', async () => {
      const extraProp = 'data-isvg="test"';
      const { container } = setup({
        src: fixtures.play,
        preProcessor: svgText => svgText.replace('<svg ', `<svg ${extraProp} `),
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });

    it('should handle innerRef', async () => {
      const innerRef = React.createRef<SVGElement>();

      const { container } = setup({
        src: fixtures.play,
        innerRef,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
      expect(innerRef.current).toMatchSnapshot();
    });

    it('should handle fetchOptions', async () => {
      fetchMock.enableMocks();

      setup({
        cacheRequests: false,
        src: fixtures.react,
        fetchOptions: {
          headers: {
            Authorization: 'Bearer ad99d8d5-419d-434e-97c2-3ce52e116d52',
          },
        },
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:1337/react.svg', {
          headers: {
            Authorization: 'Bearer ad99d8d5-419d-434e-97c2-3ce52e116d52',
          },
        });
      });

      fetchMock.disableMocks();
    });

    it('should handle custom props', async () => {
      const { container } = setup({
        src: fixtures.react,
        style: { width: 100 },
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();
    });
  });

  describe('cached requests', () => {
    beforeAll(() => {
      fetchMock.enableMocks();
    });

    afterAll(() => {
      fetchMock.disableMocks();
    });

    it('should request an SVG only once with cacheRequests prop', async () => {
      fetchMock.mockResponseOnce(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  body: '<svg><title>React</title><circle /></svg>',
                  headers: { 'Content-Type': 'image/svg+xml' },
                }),
              500,
            );
          }),
      );

      setup({ src: fixtures.url });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.url, false);
      });

      setup({ src: fixtures.url });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(2, fixtures.url, true);
      });

      expect(fetchMock).toHaveBeenNthCalledWith(1, fixtures.url, undefined);

      expect(cacheStore).toMatchSnapshot();
    });

    it('should handle request fail with multiple instances', async () => {
      fetchMock.mockRejectOnce(new Error('500')).mockRejectOnce(new Error('500'));

      setup({
        src: fixtures.url2,
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledTimes(1);
      });

      setup({
        src: fixtures.url2,
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle cached entries with loading status', async () => {
      fetchMock.mockResponseOnce(() =>
        Promise.resolve({
          body: '<svg><title>React</title><circle /></svg>',
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      );

      cacheStore[fixtures.react] = {
        content: '',
        status: 'loading',
      };

      setup({ src: fixtures.react });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.react, false);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(cacheStore).toMatchSnapshot();
    });

    it('should handle cached entries with loading status on error', async () => {
      const error = new Error('Failed to fetch');

      fetchMock.mockResponseOnce(() => Promise.reject(error));

      cacheStore[fixtures.react] = {
        content: '',
        status: 'loading',
      };

      setup({ src: fixtures.react });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenNthCalledWith(1, error);
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should skip the cache if `cacheRequest` is false', async () => {
      fetchMock.mockResponseOnce(() =>
        Promise.resolve({
          body: '<svg><circle /></svg>',
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      );

      setup({
        cacheRequests: false,
        src: fixtures.url,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.url, false);
      });

      expect(fetchMock.mock.calls).toHaveLength(1);

      expect(cacheStore).toMatchSnapshot();
    });
  });

  describe('integration', () => {
    beforeAll(() => {
      fetchMock.resetMocks();
    });

    it('should handle race condition with fast src changes', async () => {
      fetchMock.enableMocks();
      fetchMock
        .mockResponseOnce(
          () =>
            new Promise(resolve => {
              setTimeout(
                () =>
                  resolve({
                    body: '<svg><title>React</title><circle /></svg>',
                    headers: { 'Content-Type': 'image/svg+xml' },
                  }),
                0,
              );
            }),
        )
        .mockResponseOnce(
          () =>
            new Promise(resolve => {
              setTimeout(
                () =>
                  resolve({
                    body: '<svg><title>React</title><circle /></svg>',
                    headers: { 'Content-Type': 'image/svg+xml' },
                  }),
                0,
              );
            }),
        );

      const { container, rerender } = setup({ src: fixtures.react, title: 'React' });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenNthCalledWith(1, fixtures.react, undefined);
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(1, fixtures.react, false);
      });

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.url2}
          title="Javascript"
        />,
      );

      await waitFor(() => {
        expect(fetchMock).toHaveBeenNthCalledWith(2, fixtures.url2, undefined);
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(2, fixtures.url2, false);
      });

      rerender(
        <ReactInlineSVG
          loader={<Loader />}
          onError={mockOnError}
          onLoad={mockOnLoad}
          src={fixtures.react}
        />,
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenNthCalledWith(3, fixtures.react, true);
      });

      expect(container.querySelector('svg')).toMatchSnapshot('svg');

      expect(cacheStore).toMatchSnapshot('cacheStore');

      fetchMock.disableMocks();
    });

    it('should render multiple SVGs', async () => {
      const { container } = render(
        <div>
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.react} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.circles} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.dots} />
          <ReactInlineSVG onLoad={mockOnLoad} src={fixtures.datahref} />
        </div>,
      );

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(4);
      });

      expect(container.querySelectorAll('svg')).toHaveLength(4);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should handle pre-cached entries in the cacheStore', async () => {
      fetchMock.enableMocks();

      cacheStore[fixtures.react] = {
        content: '<svg><circle /></svg>',
        status: 'loaded',
      };

      const { container } = render(<ReactInlineSVG onLoad={mockOnLoad} src={fixtures.react} />);

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(fetchMock).toHaveBeenCalledTimes(0);

      expect(container.querySelector('svg')).toMatchSnapshot();

      // clean up
      fetchMock.disableMocks();
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      mockOnError.mockClear();
    });

    it('should trigger an error if empty', async () => {
      // @ts-ignore
      const { container } = setup({});

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
      });

      expect(container.querySelector('svg')).toBeNull();
    });

    it('should trigger an error on empty `src` prop changes', async () => {
      const { container, rerender } = setup({
        src: fixtures.urlEncoded,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      expect(container.querySelector('svg')).toMatchSnapshot();

      rerender(
        <ReactInlineSVG loader={<Loader />} onError={mockOnError} onLoad={mockOnLoad} src="" />,
      );

      expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
    });

    it('should trigger an error and render the fallback children if src is not found', async () => {
      const { container } = setup({
        src: 'http://127.0.0.1:1337/DOESNOTEXIST.svg',
        children: (
          <div className="missing">
            <span>MISSING</span>
          </div>
        ),
      });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error('Not found'));
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    it('should trigger an error if the request content-type is not valid', async () => {
      await setup({ src: fixtures.react_png });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(new Error("Content type isn't valid: image/png"));
      });
    });

    it('should trigger an error if the content is not valid', async () => {
      await setup({ src: fixtures.html });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          new Error('Could not convert the src to a React element'),
        );
      });
    });
  });
});
