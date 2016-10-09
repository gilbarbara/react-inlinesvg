/*eslint-disable no-console, no-underscore-dangle */
import expect from 'expect';
import React from 'react';
import { mount } from 'enzyme';

import ReactInlineSVG from '../src';

const svgResponse = { text: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' };

/**
 * Create a new iSvg element.
 *
 * @param {Object} props
 * @returns {*}
 */
function setup(props = {}) {
  return mount(
    <ReactInlineSVG {...props} />
  );
}

describe('react-inlinesvg', () => {
  describe('where httpplease has been mocked out', () => {
    before(() => {
      let getCallCount = 0;

      ReactInlineSVG.__Rewire__('http', {
        get: (src, callback) => {
          setTimeout(() => callback(++getCallCount > 1 ? new Error('Unexpected Second Call') : null, svgResponse), 0);
        }
      });
    });

    it('should request an SVG only once when caching', done => {
      let loadCallbacks = 0;

      setup({
        src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
        onLoad: () => {
          loadCallbacks++;
        },
        cacheGetRequests: true
      });

      setup({
        src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
        onError: err => {
          done(err);
        },
        onLoad: () => {
          expect(loadCallbacks).toBe(1);
          done();
        },
        cacheGetRequests: true
      });
    });

    it('it should call load on newly instantiated icons even if cached', done => {
      setup({
        src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
        onLoad: () => {
          setup({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onError: err => {
              done(err);
            },
            onLoad: () => {
              done();
            },
            cacheGetRequests: true
          });
        },
        cacheGetRequests: true
      });
    });

    after(() => {
      ReactInlineSVG.__ResetDependency__('http');
    });
  });

  it('should be a Component', () => {
    const wrapper = setup({ src: '' });

    expect(wrapper.instance() instanceof React.Component).toBe(true);
  });

  it('should load an svg', done => {
    setup({
      src: '/test/tiger.svg',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should load a base64 data-uri', done => {
    setup({
      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should load a non-base64 data-uri', done => {
    setup({
      src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should call onError for a 404', done => {
    setup({
      src: 'DOESNOTEXIST.svg',
      onError: () => done()
    });
  });

  it('should load SVGs from a CORS-enabled domain', done => {
    setup({
      src: 'http://localhost:1338/test/tiger.svg',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  context('with errors', () => {
    it('should show children if loading not supported', () => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: [React.DOM.span({ key: 1 }, ''), React.DOM.span({ key: 2 }, 'MISSINGNO')],
        supportTest: () => false
      };

      const wrapper = setup(props);
      expect(wrapper.find('.isvg > span').length).toBe(2);
    });

    it('should show a single children if loading not supported', () => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: React.DOM.img({ src: '/test/tiger.png' }),
        supportTest: () => false
      };

      const wrapper = setup(props);
      const img = wrapper.find('img');

      expect(img.length).toBe(1);
      expect(img.props().src).toBe('/test/tiger.png');
    });

    it('should NOT show children on error', () => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: [React.DOM.span({ key: 1 }, ''), React.DOM.span({ key: 2 }, 'MISSINGNO')]
      };

      const wrapper = setup(props);
      expect(wrapper.find('.isvg').hasClass('loading')).toBe(true);

      setup(props);
    });

    it('should have a status code HTTP errors', done => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        onError: err => {
          if (err.isHttpError && err.status === 404) {
            return done();
          }

          return done(new Error('Error missing information'));
        }
      };

      setup(props);
    });
  });
});
