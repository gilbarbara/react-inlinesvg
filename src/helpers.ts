import { canUseDOM as canUseDOMFlag } from 'exenv';

import type { PlainObject } from './types';

export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  READY: 'ready',
  UNSUPPORTED: 'unsupported',
} as const;

export function canUseDOM(): boolean {
  return canUseDOMFlag;
}

export function isSupportedEnvironment(): boolean {
  return supportsInlineSVG() && typeof window !== 'undefined' && window !== null;
}

export function supportsInlineSVG(): boolean {
  /* istanbul ignore next */
  if (!document) {
    return false;
  }

  const div = document.createElement('div');

  div.innerHTML = '<svg />';
  const svg = div.firstChild as SVGSVGElement;

  return !!svg && svg.namespaceURI === 'http://www.w3.org/2000/svg';
}

function randomCharacter(character: string) {
  return character[Math.floor(Math.random() * character.length)];
}

export function randomString(length: number): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '1234567890';
  const charset = `${letters}${letters.toUpperCase()}${numbers}`;

  let R = '';

  for (let index = 0; index < length; index++) {
    R += randomCharacter(charset);
  }

  return R;
}

/**
 *  Remove properties from an object
 */
export function omit<T extends PlainObject, K extends keyof T>(
  input: T,
  ...filter: K[]
): Omit<T, K> {
  const output: any = {};

  for (const key in input) {
    /* istanbul ignore else */
    if ({}.hasOwnProperty.call(input, key)) {
      if (!filter.includes(key as unknown as K)) {
        output[key] = input[key];
      }
    }
  }

  return output as Omit<T, K>;
}
