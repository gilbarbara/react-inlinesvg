import React from 'react';

import ReactInlineSVG from '../src/index.tsx';
import { InlineSVGError } from '../src/utils.ts';

const Loader = () => <div id="loader" />;

const fixtures = {
  icons: 'http://localhost:1337/icons.svg',
  play: 'http://localhost:1337/play.svg',
  react: 'http://localhost:1337/react.svg',
  tiger: 'http://localhost:1337/tiger.svg',
  url:
    'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
  base64:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  urlEncoded:
    'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
  plain:
    '<svg width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><g> <polygon fill="#000000" points="7 5 7 19 18 12"></polygon></g></svg>',
};

const mockOnError = jest.fn();

function setup({ onLoad, ...rest }) {
  return new Promise(resolve => {
    const wrapper = mount(
      <ReactInlineSVG
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
      />,
    );

    return wrapper;
  });
}

describe('react-inlinesvg', () => {
  describe('basic functionality', () => {
    it('should load a base64 src', async () => {
      const wrapper = await setup({
        src: fixtures.base64,
        title: 'base64',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should load an urlEncoded src', async () => {
      const wrapper = await setup({
        src: fixtures.urlEncoded,
        title: 'URL Encoded',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should load an plain svg src', async () => {
      const wrapper = await setup({
        src: fixtures.plain,
        title: 'Plain',
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('should load an svg url and add title and description', async () => {
      const wrapper = await setup({
        src: fixtures.react,
        title: 'React',
        description: 'React is a view library',
      });

      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });

    it('should load an svg url and replace existing title and description', async () => {
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
        ...wrapper.props(),
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
      expect(wrapper.find('radialgradient').prop('id')).toEqual(
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

    it('should transform the SVG text when given the preProcessor prop', async () => {
      const extraProp = 'data-isvg="test"';
      const wrapper = await setup({
        src: fixtures.play,
        preProcessor: svgText => svgText.replace('<svg ', `<svg ${extraProp} `),
      });

      wrapper.update();
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
    it('should request an SVG only once when caching', done => {
      const second = () => {
        setup({
          src: fixtures.url,
          onLoad: (src, isCached) => {
            expect(isCached).toBe(true);
            done();
          },
        });
      };

      setup({
        src: fixtures.url,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(false);
          second();
        },
      });
    });

    it('it should call load on newly instantiated icons even if cached', done => {
      const second = () =>
        setup({
          src: fixtures.url,
          onLoad: value => {
            expect(value).toBe(fixtures.url);
            done();
          },
        });

      setup({
        src: fixtures.url,
        onLoad: () => {
          second();
        },
      });
    });

    it('should skip the cache if `cacheRequest` is false', async () => {
      const wrapper = await setup({
        cacheRequests: false,
        src: fixtures.url,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(false);
        },
      });

      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('with errors', () => {
    it('should dispatch an error on empty `src` prop changes ', async () => {
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

    it('should dispatch an error and show the fallback children if src is not found', async () => {
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
  });
});
