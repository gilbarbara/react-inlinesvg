/* tslint:disable:object-literal-sort-keys jsx-no-lambda */

import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import * as fetchMock from 'fetch-mock';

import ReactInlineSVG from '../src/index';
import { InlineSVGError } from '../src/helpers';

interface IProps {
  src: string;
  onLoad?: (src: string, isCached: boolean) => void;
  preProcessor?: (input: string) => string;

  [key: string]: any;
}

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
  url:
    'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
  base64:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  urlEncoded:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
  string:
    '<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g> <polygon fill="#000000" points="7 5 7 19 18 12"></polygon></g></svg>',
};

const mockOnError = jest.fn();

function setup({ onLoad, ...rest }: IProps): Promise<ReactWrapper> {
  return new Promise(resolve => {
    const wrapper = mount(
      <ReactInlineSVG
        onLoad={(src, isCached) => {
          setTimeout(() => {
            if (onLoad) {
              onLoad(src, isCached);
            }

            resolve(wrapper);
          }, 0);
        }}
        onError={error => {
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
    it('should handle a base64 src', async () => {
      const wrapper = await setup({
        src: fixtures.base64,
        title: 'base64',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should handle an urlEncoded src', async () => {
      const wrapper = await setup({
        src: fixtures.urlEncoded,
        title: 'URL Encoded',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should handle a svg string src', async () => {
      const wrapper = await setup({
        src: fixtures.string,
        title: 'String',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should handle an svg url and add title and description', async () => {
      const wrapper = await setup({
        src: fixtures.react,
        title: 'React',
        description: 'React is a view library',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle a svg url with mask, gradient and classes', async () => {
      const wrapper = await setup({
        src: fixtures.dots,
        title: 'Dots',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle a svg url with external css, style and script', async () => {
      const wrapper = await setup({
        src: fixtures.circles,
        title: 'Circles',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle a svg url with symbols', async () => {
      const wrapper = await setup({ src: fixtures.icons });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle an svg url and replace existing title and description', async () => {
      const wrapper = await setup({
        src: fixtures.tiger,
        title: 'The Tiger',
        description: 'Is this a tiger?',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle a loader', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        loader: <Loader />,
      });

      expect(wrapper.find('Loader')).toExist();
      expect(wrapper).toMatchSnapshot();

      wrapper.update();
      expect(wrapper.find('Loader')).not.toExist();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle src changes', async () => {
      const wrapper = await setup({ src: '' });

      expect(wrapper).toMatchSnapshot();

      wrapper.setProps({
        src: fixtures.react,
        title: 'Test',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should uniquify ids with the default uniqueHash', async () => {
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
      expect(wrapper).toMatchSnapshot();
    });

    it('should prefix the ids with the baseURL', async () => {
      const wrapper = await setup({
        src: fixtures.play,
        baseURL: 'https://github.com/gilbarbara/react-inlinesvg/',
        uniquifyIDs: true,
      });

      wrapper.update();

      expect(wrapper.find('svg')).toExist();
      expect(wrapper.find('circle').prop('fill')).toEqual(
        expect.stringMatching(
          /https:\/\/github\.com\/gilbarbara\/react-inlinesvg\/#radialGradient-1__.*?/,
        ),
      );
    });

    it('should not uniquify non-id hrefs', async () => {
      const wrapper = await setup({
        src: fixtures.datahref,
        uniquifyIDs: true,
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should transform the SVG text with the preProcessor prop', async () => {
      const extraProp = 'data-isvg="test"';
      const wrapper = await setup({
        src: fixtures.play,
        preProcessor: svgText => svgText.replace('<svg ', `<svg ${extraProp} `),
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should handle innerRef', async () => {
      const innerRef = React.createRef();

      const wrapper = await setup({
        src: fixtures.play,
        innerRef,
      });

      wrapper.update();

      expect(innerRef.current).toMatchSnapshot();
      expect(wrapper).toMatchSnapshot();
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
      fetchMock.get(
        '*',
        new Promise(res =>
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
    });

    afterAll(() => {
      fetchMock.restore();
    });

    it('should request an SVG only once with cacheRequests prop', done => {
      const second = () => {
        setup({
          src: fixtures.url,
          onLoad: (src, isCached) => {
            expect(isCached).toBe(true);
            expect(fetchMock.calls()).toHaveLength(1);

            done();
          },
        });
      };

      setup({
        src: fixtures.url,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(false);
          expect(fetchMock.calls()).toHaveLength(1);

          second();
        },
      });

      setup({
        src: fixtures.url,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(true);
          expect(fetchMock.calls()).toHaveLength(1);
        },
      });
    });

    it('should skip the cache if `cacheRequest` is false', async () => {
      const wrapper = await setup({
        cacheRequests: false,
        src: fixtures.url,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(false);
          expect(fetchMock.calls()).toHaveLength(2);
        },
      });

      expect(wrapper).toMatchSnapshot();
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
      expect(wrapper).toMatchSnapshot();

      expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('Missing src'));
    });

    it('should trigger an error on empty `src` prop changes', async () => {
      const wrapper = await setup({
        src: fixtures.urlEncoded,
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();

      wrapper.setProps({
        ...wrapper.props(),
        src: '',
      });

      expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('Missing src'));
    });

    it('should trigger an error and show the fallback children if src is not found', async () => {
      const wrapper = await setup({
        src: 'http://localhost:1337/DOESNOTEXIST.svg',
        children: (
          <div className="missing">
            <span>MISSING</span>
          </div>
        ),
      });

      wrapper.update();

      expect(mockOnError).toHaveBeenCalledWith(new InlineSVGError('Not Found'));
      expect(wrapper.find('.missing')).toExist();
    });

    it('should trigger an error if the request content-type is not valid', async () => {
      await setup({
        src: fixtures.react_png,
      });

      expect(mockOnError).toHaveBeenCalledWith(
        new InlineSVGError("Content type isn't valid: image/png"),
      );
    });

    it('should trigger an error if the content is not valid', async () => {
      fetchMock.get('*', {
        body: '<html lang="en"><body>Text</body></html>',
        headers: { 'Content-Type': 'image/svg+xml' },
      });

      await setup({
        src: fixtures.react_png,
      });

      expect(mockOnError).toHaveBeenCalledWith(
        new InlineSVGError('Could not convert the src to a React element'),
      );

      fetchMock.restore();
    });
  });
});
