import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { STATUS } from '../src/config';
import ReactInlineSVG, { cacheStore, clearElementCache, Props } from '../src/index';
import { getElementCacheSize } from '../src/modules/elementCache';

const svgs = {
  circle:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  titled:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Original</title><circle cx="12" cy="12" r="10"/></svg>',
  withIDs:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="grad"/></defs><rect fill="url(#grad)"/></svg>',
} as const;

const url = 'https://cdn.svglogos.dev/logos/react.svg';
const notAnSVG =
  'data:image/svg+xml,%3Chtml%20lang%3D%22en%22%3E%3Cbody%3EText%3C%2Fbody%3E%3C%2Fhtml%3E';

let parse: ReturnType<typeof vi.spyOn>;

async function setup(props: Props) {
  const view = render(<ReactInlineSVG {...props} />);

  await waitFor(() => {
    expect(view.container.querySelector('svg')).toBeInTheDocument();
  });

  return view;
}

function svgOf(view: Awaited<ReturnType<typeof setup>>) {
  return view.container.querySelector('svg')!;
}

describe('cacheElements', () => {
  beforeEach(() => {
    clearElementCache();
    parse = vi.spyOn(DOMParser.prototype, 'parseFromString');
  });

  afterEach(async () => {
    parse.mockRestore();
    await cacheStore.clear();
  });

  describe('when it is off (the default)', () => {
    it('should convert the content on every mount', async () => {
      await setup({ src: svgs.circle });
      await setup({ src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(2);
    });

    it('should not read entries left by a component that has it on', async () => {
      await setup({ cacheElements: true, src: svgs.circle });
      await setup({ src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(2);
    });

    it('should not write entries that a component with it on could read', async () => {
      await setup({ src: svgs.circle });
      await setup({ cacheElements: true, src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(2);
    });

    it('should leave the cache empty', async () => {
      await setup({ src: svgs.circle });
      await setup({ src: svgs.titled, title: 'Titled' });

      expect(getElementCacheSize()).toBe(0);
    });
  });

  describe('when it is on', () => {
    it('should convert identical content once, however many times it is mounted', async () => {
      const first = await setup({ cacheElements: true, src: svgs.circle });
      const second = await setup({ cacheElements: true, src: svgs.circle });
      const third = await setup({ cacheElements: true, src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(1);

      for (const view of [first, second, third]) {
        expect(svgOf(view).querySelector('circle')).toHaveAttribute('r', '10');
        expect(svgOf(view)).toHaveAttribute('viewBox', '0 0 24 24');
      }
    });

    it('should convert different content separately', async () => {
      const first = await setup({ cacheElements: true, src: svgs.circle });
      const second = await setup({ cacheElements: true, src: svgs.withIDs });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(svgOf(first).querySelector('circle')).toBeInTheDocument();
      expect(svgOf(second).querySelector('rect')).toBeInTheDocument();
    });

    it('should still apply the props of each instance to the reused element', async () => {
      const first = await setup({ cacheElements: true, className: 'first', src: svgs.circle });
      const second = await setup({
        cacheElements: true,
        className: 'second',
        src: svgs.circle,
        width: 48,
      });

      expect(parse).toHaveBeenCalledTimes(1);
      expect(svgOf(first)).toHaveClass('first');
      expect(svgOf(first)).not.toHaveAttribute('width');
      expect(svgOf(second)).toHaveClass('second');
      expect(svgOf(second)).toHaveAttribute('width', '48');
    });

    it('should reuse the converted content of an SVG already in the cacheStore', async () => {
      cacheStore.set(url, { content: svgs.circle, status: STATUS.LOADED });

      await setup({ cacheElements: true, src: url });
      await setup({ cacheElements: true, src: url });

      expect(parse).toHaveBeenCalledTimes(1);
    });

    it('should not cache content that fails to convert', async () => {
      const onError = vi.fn();

      render(
        <ReactInlineSVG cacheElements onError={onError} src={notAnSVG}>
          <span data-testid="fallback" />
        </ReactInlineSVG>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });

      expect(onError).toHaveBeenCalled();
      expect(getElementCacheSize()).toBe(0);
    });

    it('should convert again after the cache is cleared', async () => {
      await setup({ cacheElements: true, src: svgs.circle });
      clearElementCache();
      await setup({ cacheElements: true, src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(2);
    });
  });

  describe('when it is on, props that shape the markup', () => {
    it('should keep each title separate', async () => {
      const first = await setup({ cacheElements: true, src: svgs.circle, title: 'First' });
      const second = await setup({ cacheElements: true, src: svgs.circle, title: 'Second' });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(svgOf(first).querySelector('title')).toHaveTextContent('First');
      expect(svgOf(second).querySelector('title')).toHaveTextContent('Second');
    });

    it('should tell a removed title apart from an untouched one', async () => {
      const kept = await setup({ cacheElements: true, src: svgs.titled });
      const removed = await setup({ cacheElements: true, src: svgs.titled, title: null });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(svgOf(kept).querySelector('title')).toHaveTextContent('Original');
      expect(svgOf(removed).querySelector('title')).not.toBeInTheDocument();
    });

    it('should keep each description separate', async () => {
      const first = await setup({ cacheElements: true, description: 'First', src: svgs.circle });
      const second = await setup({ cacheElements: true, description: 'Second', src: svgs.circle });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(svgOf(first).querySelector('desc')).toHaveTextContent('First');
      expect(svgOf(second).querySelector('desc')).toHaveTextContent('Second');
    });

    it('should key on what the preProcessor returns, not on the src', async () => {
      const red = await setup({
        cacheElements: true,
        preProcessor: code => code.replace('<svg ', '<svg fill="red" '),
        src: svgs.circle,
      });
      const blue = await setup({
        cacheElements: true,
        preProcessor: code => code.replace('<svg ', '<svg fill="blue" '),
        src: svgs.circle,
      });
      const redAgain = await setup({
        cacheElements: true,
        preProcessor: code => code.replace('<svg ', '<svg fill="red" '),
        src: svgs.circle,
      });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(svgOf(red)).toHaveAttribute('fill', 'red');
      expect(svgOf(blue)).toHaveAttribute('fill', 'blue');
      expect(svgOf(redAgain)).toHaveAttribute('fill', 'red');
    });

    it('should give every uniquifyIDs instance its own ids', async () => {
      const first = await setup({ cacheElements: true, src: svgs.withIDs, uniquifyIDs: true });
      const second = await setup({ cacheElements: true, src: svgs.withIDs, uniquifyIDs: true });

      const firstID = first.container.querySelector('linearGradient')!.getAttribute('id');
      const secondID = second.container.querySelector('linearGradient')!.getAttribute('id');

      expect(firstID).toMatch(/^grad__.{8}$/);
      expect(secondID).toMatch(/^grad__.{8}$/);
      expect(firstID).not.toBe(secondID);
      expect(parse).toHaveBeenCalledTimes(2);
    });

    it('should share the conversion between uniquifyIDs instances with the same uniqueHash', async () => {
      const first = await setup({
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a1f8d1b2',
        uniquifyIDs: true,
      });
      const second = await setup({
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a1f8d1b2',
        uniquifyIDs: true,
      });

      expect(parse).toHaveBeenCalledTimes(1);
      expect(first.container.querySelector('linearGradient')).toHaveAttribute(
        'id',
        'grad__a1f8d1b2',
      );
      expect(second.container.querySelector('linearGradient')).toHaveAttribute(
        'id',
        'grad__a1f8d1b2',
      );
    });

    it('should not reuse a uniquifyIDs conversion for an instance without it', async () => {
      const unique = await setup({
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a1f8d1b2',
        uniquifyIDs: true,
      });
      const plain = await setup({ cacheElements: true, src: svgs.withIDs });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(unique.container.querySelector('linearGradient')).toHaveAttribute(
        'id',
        'grad__a1f8d1b2',
      );
      expect(plain.container.querySelector('linearGradient')).toHaveAttribute('id', 'grad');
    });

    it('should keep each baseURL separate for uniquifyIDs instances', async () => {
      const home = await setup({
        baseURL: '/home',
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a1f8d1b2',
        uniquifyIDs: true,
      });
      const about = await setup({
        baseURL: '/about',
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a1f8d1b2',
        uniquifyIDs: true,
      });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(home.container.querySelector('rect')).toHaveAttribute(
        'fill',
        'url(/home#grad__a1f8d1b2)',
      );
      expect(about.container.querySelector('rect')).toHaveAttribute(
        'fill',
        'url(/about#grad__a1f8d1b2)',
      );
    });

    it('should keep the hash and the baseURL from running into each other', async () => {
      // Two instances whose hash and baseURL only differ in where the boundary between them falls.
      const hashHasSeparator = await setup({
        baseURL: 'c',
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a|b',
        uniquifyIDs: true,
      });
      const baseURLHasSeparator = await setup({
        baseURL: 'b|c',
        cacheElements: true,
        src: svgs.withIDs,
        uniqueHash: 'a',
        uniquifyIDs: true,
      });

      expect(parse).toHaveBeenCalledTimes(2);
      expect(hashHasSeparator.container.querySelector('rect')).toHaveAttribute(
        'fill',
        'url(c#grad__a|b)',
      );
      expect(baseURLHasSeparator.container.querySelector('rect')).toHaveAttribute(
        'fill',
        'url(b|c#grad__a)',
      );
    });
  });
});
