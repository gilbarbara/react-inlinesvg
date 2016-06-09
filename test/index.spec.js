import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom/server';
import TestUtils from 'react-addons-test-utils';

import ReactInlineSVG from '../src';

const svgResponse = {text: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}


/**
 * Create a new iSvg element.
 *
 * @param {Object} props
 * @returns {*}
 */
function setup(props = {}) {
  return TestUtils.renderIntoDocument(
    <ReactInlineSVG {...props} />
  );
}

describe('react-inlinesvg', () => {
  describe('where httpplease has been mocked out', () =>
  {
    before(() =>
    {
      let getCallCount = 0;

      ReactInlineSVG.__Rewire__('http', {
        get: (src, callback) =>
        {
          console.log('mocked get call')
          setTimeout(() => callback(++getCallCount > 1 ? new Error('Unexpected Second Call') : null, svgResponse), 0)
        }
      });
    })

    it('should request an SVG only once when caching', done =>
    {
      let loadCallbacks = 0

      let component = setup({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onLoad: () =>
            {
              console.log('loadCallbacks')
              loadCallbacks++
            },
            cacheGetRequests: true
          }
      )

      let secondComponent = setup({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onError: (err) =>
            {
              done(err)
            },
            onLoad: () =>
            {
              console.log(loadCallbacks, 'loadCallbacks')
              expect(loadCallbacks).toBe(1)
              done()
            },
            cacheGetRequests: true
          }
      )
    })

    it('it should call load on newly instantiated icons even if cached', done =>
    {
      let component = setup({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onLoad: () => {
              console.log('first onLoad')
              let secondComponent = setup({
                    src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
                    onError: (err) =>
                    {
                      console.log('second onLoad')
                      done(err)
                    },
                    onLoad: () =>
                    {
                      console.log('second onLoad')
                      done()
                    },
                    cacheGetRequests: true
                  }
              )
            },
            cacheGetRequests: true
          }
      )
    })

    after( ()=> {
        ReactInlineSVG.__ResetDependency__('http');
    })
  })

  it('should be a Component', () => {
    const render = setup({ src: '' });

    expect(TestUtils.isCompositeComponent(render)).toBe(true);
  });

  it('should load an svg', (done) => {
    setup({
      src: '/test/tiger.svg',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should load a base64 data-uri', (done) => {
    setup({
      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should load a non-base64 data-uri', (done) => {
    setup({
      src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  it('should call onError for a 404', (done) => {
    setup({
      src: 'DOESNOTEXIST.svg',
      onError: () => done()
    });
  });

  it('should load SVGs from a CORS-enabled domain', (done) => {
    setup({
      src: 'http://localhost:1338/test/tiger.svg',
      onError: done,
      onLoad: () => {
        done();
      }
    });
  });

  context('errors', () => {
    it('should show children if loading not supported', (done) => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: [React.DOM.span({ key: 1 }, ''), React.DOM.span({ key: 2 }, 'MISSINGNO')],
        supportTest: () => false,
        onError: () => {
          const el = ReactDOM.renderToStaticMarkup(<ReactInlineSVG {...props} />);

          if (/MISSINGNO/.test(el)) {
            return done();
          }

          return done(new Error('Missing fallback contents'));
        }
      };

      setup(props);
    });

    it('should show a single children if loading not supported', (done) => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: React.DOM.img({ src: '/test/tiger.png' }),
        supportTest: () => false,
        onError: () => {
          const el = ReactDOM.renderToStaticMarkup(<ReactInlineSVG {...props} />);

          if (/src="\/test\/tiger.png"/.test(el)) {
            return done();
          }

          return done(new Error('Missing fallback contents'));
        }
      };

      setup(props);
    });

    it('should should NOT show children on error', (done) => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        children: [React.DOM.span({ key: 1 }, ''), React.DOM.span({ key: 2 }, 'MISSINGNO')],
        onError: () => {
          const el = ReactDOM.renderToStaticMarkup(<ReactInlineSVG {...props} />);

          if (/MISSINGNO/.test(el)) {
            return done(new Error('Children shown even though loading is supported'));
          }

          return done();
        }
      };

      setup(props);
    });

    it('should have a status code HTTP errors', (done) => {
      const props = {
        src: 'DOESNOTEXIST.svg',
        onError: (err) => {
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
