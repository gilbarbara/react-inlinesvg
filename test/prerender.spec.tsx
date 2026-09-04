import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, waitFor } from '@testing-library/react';

import InlineSVG, { cacheStore } from '../src';

/**
 * Frameworks that prerender client components at build time reject any
 * non-deterministic value read during render. Next.js with `cacheComponents`
 * enabled patches `Math.random`, `Date.now` and `crypto.randomUUID` to detect
 * this, and aborts the enclosing Suspense boundary when one is called.
 *
 * The unique hash is only consumed when `uniquifyIDs` is set, and only once the
 * SVG content has loaded — which requires the DOM. It must therefore never be
 * generated during a server render.
 */
describe('server rendering', () => {
  const fixtures = {
    play: 'http://127.0.0.1:1337/play.svg',
    url: 'https://cdn.svglogos.dev/logos/react.svg',
    urlEncoded:
      'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%3C%2Fsvg%3E',
  } as const;

  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    randomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it.each([
    ['a remote url', { src: fixtures.url }],
    ['a data uri', { src: fixtures.urlEncoded }],
    ['uniquifyIDs', { src: fixtures.url, uniquifyIDs: true }],
    ['a custom uniqueHash', { src: fixtures.url, uniqueHash: 'test', uniquifyIDs: true }],
  ])('should not call Math.random when rendering with %s', (_, props) => {
    renderToStaticMarkup(<InlineSVG {...props} />);

    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('should still uniquify ids once the content is rendered on the client', async () => {
    const { container } = render(<InlineSVG src={fixtures.play} uniquifyIDs />);

    await waitFor(() => {
      expect(container.querySelector('radialGradient')).not.toBeNull();
    });

    expect(randomSpy).toHaveBeenCalled();
    expect(container.querySelector('radialGradient')?.getAttribute('id')).toEqual(
      expect.stringMatching(/^radialGradient-1__.+/),
    );
  });

  it('should use one hash for every id when rendering from a warm cache', async () => {
    // The cached branch of the reducer initializer is the only place the hash is
    // read during a render, so it needs to stay stable across a StrictMode
    // double render.
    const view = render(<InlineSVG src={fixtures.play} uniquifyIDs />);

    await waitFor(() => {
      expect(view.container.querySelector('radialGradient')).not.toBeNull();
    });

    expect(cacheStore.isCached(fixtures.play)).toBe(true);

    const { container } = render(
      <React.StrictMode>
        <InlineSVG src={fixtures.play} uniquifyIDs />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(container.querySelector('radialGradient')).not.toBeNull();
    });

    const suffixes = new Set(
      [...container.querySelectorAll('[id]')].map(node => node.getAttribute('id')?.split('__')[1]),
    );

    expect(suffixes.size).toBe(1);
    expect([...suffixes][0]).toBeTruthy();
  });
});
