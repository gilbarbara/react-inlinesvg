import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import fetchMock from 'jest-fetch-mock';

import ReactInlineSVG, { Props } from '../src/index';

const Loader = () => <div id="loader" />;

const fixtures = {
  circles: 'http://localhost:1337/circles.svg',
  dots: 'http://localhost:1337/dots.svg',
  icons: 'http://localhost:1337/icons.svg',
  play: 'http://localhost:1337/play.svg',
  react: 'http://localhost:1337/react.svg',
  react_png: 'http://localhost:1337/react.png',
  tiger: 'http://localhost:1337/tiger.svg',
  datahref: 'http://localhost:1337/datahref.svg',
  styles: 'http://localhost:1337/styles.svg',
  utf8: 'http://localhost:1337/utf8.svg',
  url: 'https://cdn.svgporn.com/logos/react.svg',
  url2: 'https://cdn.svgporn.com/logos/javascript.svg',
  base64:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  urlEncoded:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
  html: 'data:image/svg+xml,%3Chtml%20lang%3D%22en%22%3E%3Cbody%3EText%3C%2Fbody%3E%3C%2Fhtml%3E',
  string:
    '<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g> <polygon fill="#000000" points="7 5 7 19 18 12"></polygon></g></svg>',
};

const mockOnError = jest.fn();

function setup({ onLoad, ...rest }: Props): Promise<ReactWrapper<Props>> {
  return new Promise((resolve) => {
    const wrapper = mount<Props>(
      <ReactInlineSVG
        onLoad={(src, isCached) => {
          setTimeout(() => {
            if (onLoad) {
              onLoad(src, isCached);
            }

            resolve(wrapper);
          }, 0);
        }}
        onError={(error) => {
          mockOnError(error);
          setTimeout(() => resolve(wrapper), 0);
        }}
        {...rest}
      />,
    );

    return wrapper;
  });
}

describe('react-inlinesvg', () => {
  describe('basic functionality', () => {
    it('should render a base64 src', async () => {
      const wrapper = await setup({
        src: fixtures.base64,
        title: 'base64',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render an urlEncoded src', async () => {
      const wrapper = await setup({
        src: fixtures.urlEncoded,
        title: 'URL Encoded',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg string src', async () => {
      const wrapper = await setup({
        src: fixtures.string,
        title: 'String',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render an svg url and add title and description', async () => {
      const wrapper = await setup({
        src: fixtures.react,
        title: 'React',
        description: 'React is a view library',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg url with mask, gradient and classes', async () => {
      const wrapper = await setup({
        src: fixtures.dots,
        title: 'Dots',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg url with external css, style and script', async () => {
      const wrapper = await setup({
        src: fixtures.circles,
        title: 'Circles',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg url with inline styles', async () => {
      const wrapper = await setup({
        src: fixtures.styles,
        uniquifyIDs: true,
        uniqueHash: 'test',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg url with symbols', async () => {
      const wrapper = await setup({ src: fixtures.icons });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a svg url with utf-8 characters', async () => {
      const wrapper = await setup({ src: fixtures.utf8 });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render an svg url and replace existing title and description', async () => {
      const wrapper = await setup({
        src: fixtures.tiger,
        title: 'The Tiger',
        description: 'Is this a tiger?',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should render a loader', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        loader: <Loader />,
      });

      expect(wrapper.html()).toMatchSnapshot();

      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should handle src changes', async () => {
      const wrapper = await setup({ src: '' });

      expect(wrapper.html()).toMatchSnapshot();

      wrapper.setProps({
        src: fixtures.react,
        title: 'Test',
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should uniquify ids with the random uniqueHash', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        uniquifyIDs: true,
      });
      wrapper.update();

      expect(wrapper.find('svg')).toExist();
      expect(wrapper.find('radialGradient').prop('id')).toEqual(
        expect.stringMatching(/radialGradient-1__.*?/),
      );
    });

    it('should uniquify ids with a custom uniqueHash', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        uniqueHash: 'test',
        uniquifyIDs: true,
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should prefix the ids with the baseURL', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        baseURL: 'https://example.com/',
        uniqueHash: 'test',
        uniquifyIDs: true,
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should not uniquify non-id hrefs', async () => {
      const wrapper = await setup({
        src: fixtures.datahref,
        uniquifyIDs: true,
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should transform the SVG text with the preProcessor prop', async () => {
      const extraProp = 'data-isvg="test"';
      const wrapper = await setup({
        src: fixtures.play,
        preProcessor: (svgText) => svgText.replace('<svg ', `<svg ${extraProp} `),
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should handle innerRef', async () => {
      const innerRef = React.createRef<SVGElement>();

      const wrapper = await setup({
        src: fixtures.play,
        innerRef,
      });
      wrapper.update();

      expect(innerRef.current).toMatchSnapshot();
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should handle fetchOptions', async () => {
      const wrapper = await setup({
        src: fixtures.react,
        fetchOptions: {
          headers: {
            Authorization: 'Bearer ad99d8d5-419d-434e-97c2-3ce52e116d52',
          },
        },
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should handle unmount', async () => {
      const wrapper = await setup({
        src: fixtures.play,
      });

      expect(wrapper.find('InlineSVG')).toExist();

      wrapper.unmount();
      expect(wrapper.find('InlineSVG')).not.toExist();
    });
  });

  describe('cached requests', () => {
    beforeAll(() => {
      fetchMock.enableMocks();
    });

    beforeEach(() => {
      mockOnError.mockClear();
      fetchMock.mockClear();
    });

    afterAll(() => {
      fetchMock.disableMocks();
    });

    it('should request an SVG only once with cacheRequests prop', (done) => {
      fetchMock.mockResponseOnce(
        () =>
          new Promise((res) =>
            setTimeout(
              () =>
                res({
                  body: '<svg><circle /></svg>',
                  headers: { 'Content-Type': 'image/svg+xml' },
                }),
              500,
            ),
          ),
      );

      const second = () => {
        setup({
          src: fixtures.url,
          onLoad: (_src, isCached) => {
            expect(isCached).toBe(true);
            expect(fetchMock.mock.calls).toHaveLength(1);

            done();
          },
        });
      };

      setup({
        src: fixtures.url,
        onLoad: (_src, isCached) => {
          expect(isCached).toBe(false);
          expect(fetchMock.mock.calls).toHaveLength(1);

          second();
        },
      });
    });

    it('should handle request fail with multiple instances', (done) => {
      fetchMock.mockReject(new Error('500'));

      const second = () => {
        mount(
          <ReactInlineSVG
            src={fixtures.url2}
            onError={(error) => {
              mockOnError(error);

              expect(mockOnError).toHaveBeenCalledTimes(2);
              done();
            }}
          />,
        );
      };

      mount(
        <ReactInlineSVG
          src={fixtures.url2}
          onError={(error) => {
            mockOnError(error);

            second();
          }}
        />,
      );
    });

    it('should skip the cache if `cacheRequest` is false', async () => {
      fetchMock.mockResponseOnce(
        () =>
          new Promise((res) =>
            setTimeout(
              () =>
                res({
                  body: '<svg><circle /></svg>',
                  headers: { 'Content-Type': 'image/svg+xml' },
                }),
              500,
            ),
          ),
      );

      const wrapper = await setup({
        cacheRequests: false,
        src: fixtures.url,
        onLoad: (_src, isCached) => {
          expect(isCached).toBe(false);
          expect(fetchMock.mock.calls).toHaveLength(1);
        },
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      mockOnError.mockClear();
    });

    it('should trigger an error if empty', async () => {
      // @ts-ignore
      const wrapper = await setup({});
      wrapper.update();

      expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should trigger an error on empty `src` prop changes', async () => {
      const wrapper = await setup({
        src: fixtures.urlEncoded,
      });
      wrapper.update();

      expect(wrapper.html()).toMatchSnapshot();

      wrapper.setProps({
        ...wrapper.props(),
        src: '',
      });

      expect(mockOnError).toHaveBeenCalledWith(new Error('Missing src'));
    });

    it('should trigger an error and render the fallback children if src is not found', async () => {
      const wrapper = await setup({
        src: 'http://localhost:1337/DOESNOTEXIST.svg',
        children: (
          <div className="missing">
            <span>MISSING</span>
          </div>
        ),
      });
      wrapper.update();

      expect(mockOnError).toHaveBeenCalledWith(new Error('Not found'));
      expect(wrapper.html()).toMatchSnapshot();
    });

    it('should trigger an error if the request content-type is not valid', async () => {
      await setup({
        src: fixtures.react_png,
      });

      expect(mockOnError).toHaveBeenCalledWith(new Error("Content type isn't valid: image/png"));
    });

    it('should trigger an error if the content is not valid', async () => {
      await setup({
        src: fixtures.html,
      });

      expect(mockOnError).toHaveBeenCalledWith(
        new Error('Could not convert the src to a React element'),
      );
    });
  });
});
