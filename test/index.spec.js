import React from 'react';
import { mount } from 'enzyme';

import ReactInlineSVG from '../src';

const fixtures = {
  url: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
  base64: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
  inline: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
};

function setup(ownProps = {}) {
  return mount(<ReactInlineSVG {...ownProps} />);
}

describe('react-inlinesvg', () => {
  describe('basic functionality', () => {
    it('should be a Component', () => {
      const wrapper = setup({ src: '' });

      expect(wrapper.instance() instanceof React.Component).toBe(true);
    });

    it('should load a relative svg', done => {
      const src = '/test/__fixtures__/tiger.svg';

      const wrapper = setup({
        src,
        onError: done,
        onLoad: value => {
          wrapper.update();

          expect(value).toBe(src);
          expect(wrapper.find('.isvg')).toHaveClassName('loaded');
          done();
        }
      });
    });

    it('should load a base64 data-uri', () => {
      const wrapper = setup({
        src: fixtures.base64,
      });

      expect(wrapper.find('.isvg')).toHaveClassName('loaded');
    });

    it('should load a non-base64 data-uri', () => {
      const wrapper = setup({
        src: fixtures.inline,
      });

      expect(wrapper.find('.isvg')).toHaveClassName('loaded');
    });

    it('should handle `src` prop changes', done => {
      const wrapper = setup({
        src: fixtures.inline,
        onError: done,
        onLoad: src => {
          expect(src).toBe(fixtures.inline);
        },
      });

      expect(wrapper.find('.isvg')).toHaveClassName('loaded');

      wrapper.setProps({
        ...wrapper.props(),
        src: fixtures.url,
        onError: done,
        onLoad: src => {
          expect(src).toBe(fixtures.url);

          done();
        },
      });

      wrapper.update();
      expect(wrapper.find('.isvg')).toHaveClassName('loading');
    });

    it('should dispatch an error on empty `src` prop changes ', done => {
      const wrapper = setup({
        src: fixtures.inline,
      });

      expect(wrapper.find('.isvg')).toHaveClassName('loaded');

      wrapper.setProps({
        ...wrapper.props(),
        src: '',
        onError: error => {
          expect(error.message).toBe('Missing source');

          done();
        },
      });
    });

    it('should handle a custom wrapper', () => {
      const wrapper = setup({
        src: fixtures.url,
        preloader: (<div className="loader">loading</div>),
        wrapper: React.createFactory('div'),
      });

      expect(wrapper.find('.isvg')).toHaveTagName('div');
      expect(wrapper.find('.loader')).toBePresent();
    });

    it('should handle a preloader', () => {
      const wrapper = setup({
        src: fixtures.url,
        preloader: (<div className="loader">loading</div>),
      });

      expect(wrapper.find('.loader')).toBePresent();
    });

    it('should uniquify ids with the default uniqueHash', done => {
      const wrapper = setup({
        src: 'https://raw.githubusercontent.com/gilbarbara/logos/00cf8501d18b9e377ec0227b915a6f74ab4bd18f/logos/apiary.svg',
        preloader: (<div className="loader">loading</div>),
        onError: done,
        onLoad: () => {
          wrapper.update();
          const html = wrapper.find('.isvg').html();

          expect(wrapper.find('.isvg')).toHaveClassName('loaded');
          expect(/linearGradient-1___/.test(html)).toBe(true);
          done();
        }
      });
    });

    it('should uniquify ids with the a custom uniqueHash', done => {
      const wrapper = setup({
        src: 'https://raw.githubusercontent.com/gilbarbara/logos/00cf8501d18b9e377ec0227b915a6f74ab4bd18f/logos/apiary.svg',
        preloader: (<div className="loader">loading</div>),
        uniqueHash: 'test',
        onError: done,
        onLoad: () => {
          wrapper.update();
          const html = wrapper.find('.isvg').html();

          expect(wrapper.find('.isvg')).toHaveClassName('loaded');
          expect(/linearGradient-1___test/.test(html)).toBe(true);
          done();
        }
      });
    });

    it('should not uniquify ids if it\'s disabled', done => {
      const wrapper = setup({
        src: 'https://raw.githubusercontent.com/gilbarbara/logos/00cf8501d18b9e377ec0227b915a6f74ab4bd18f/logos/apiary.svg',
        uniquifyIDs: false,
        onError: done,
        onLoad: () => {
          wrapper.update();
          const html = wrapper.find('.isvg').html();

          expect(wrapper.find('.isvg')).toHaveClassName('loaded');
          expect(/linearGradient-1\b/.test(html)).toBe(true);
          done();
        }
      });
    });

    it('should call error and render fallback for a 404', done => {
      let wrapper;

      wrapper = mount(
        <ReactInlineSVG
          src="DOESNOTEXIST.svg"
          onError={
            error => {
              expect(error.isHttpError).toBe(true);
              expect(error.status).toBe(404);

              wrapper.update();
              expect(wrapper.find('.fallback')).toBePresent();
              done();
            }
          }
        >
          <div className="fallback">Load Fail</div>
        </ReactInlineSVG>
      );
    });

    it('should load SVGs from a CORS-enabled domain', done => {
      setup({
        src: 'http://localhost:1338/test/__fixtures__/tiger.svg',
        onError: done,
        onLoad: src => {
          expect(src).toBe('http://localhost:1338/test/__fixtures__/tiger.svg');
          done();
        }
      });
    });

    it('should handle unmount', () => {
      const wrapper = setup({
        src: fixtures.url,
        className: 'test'
      });

      expect(wrapper.find('.isvg')).toHaveClassName('test');
      expect(wrapper.find('.isvg')).toBePresent();

      wrapper.unmount();

      expect(wrapper.find('.isvg')).not.toBePresent();
    });
  });

  describe('cached requests', () => {
    it('should request an SVG only once when caching', done => {
      const second = () => {
        setup({
          src: fixtures.url,
          onError: done,
          onLoad: (src, isCached) => {
            expect(isCached).toBe(true);
            done();
          },
          cacheGetRequests: true
        });
      };

      setup({
        src: fixtures.url,
        onError: done,
        onLoad: (src, isCached) => {
          expect(isCached).toBe(false);
          second();
        },
        cacheGetRequests: true
      });
    });

    it('it should call load on newly instantiated icons even if cached', done => {
      const second = () => {
        setup({
          src: fixtures.url,
          onError: err => {
            done(err);
          },
          onLoad: value => {
            expect(value).toBe(fixtures.url);
            done();
          },
          cacheGetRequests: true
        });
      };

      setup({
        src: fixtures.url,
        onLoad: () => {
          second();
        },
        cacheGetRequests: true
      });
    });
  });

  describe('with errors', () => {
    it('should show children if loading not supported', done => {
      const wrapper = setup({
        src: 'DOESNOTEXIST.svg',
        children: (
          <div className="missing">
            <span>MISSINGNO</span>
          </div>
        ),
        supportTest: () => false,
        onError: error => {
          expect(error.isSupportedBrowser).toBe(false);
          expect(error.message).toBe('Unsupported Browser');

          done();
        }
      });

      expect(wrapper.find('.isvg')).toHaveClassName('unsupported');
      expect(wrapper.find('.missing')).toBePresent();
    });

    it('should show a single children if loading not supported', () => {
      const wrapper = setup({
        src: 'DOESNOTEXIST.svg',
        children: (<img src="/test/tiger.png" alt="tiger" />),
        supportTest: () => false
      });

      expect(wrapper.find('img')).toHaveProp('src', '/test/tiger.png');
    });

    it('should NOT show children on error', () => {
      const wrapper = setup({
        src: 'DOESNOTEXIST.svg',
        children: (
          <span>
            <span>MISSINGNO</span>
          </span>
        ),
      });

      expect(wrapper.find('.isvg')).toHaveClassName('loading');
      expect(wrapper.find('.isvg > span')).not.toBePresent();
    });

    it('should have a status code HTTP errors', done => {
      setup({
        src: 'DOESNOTEXIST.svg',
        onError: err => {
          if (err.isHttpError && err.status === 404) {
            done();
            return;
          }

          done(new Error('Error missing information'));
        }
      });
    });
  });
});
