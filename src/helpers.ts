import { canUseDOM as canUseDOMFlag } from 'exenv';

import { PlainObject } from './types';

export const STATUS = {
  FAILED: 'failed',
  LOADED: 'loaded',
  LOADING: 'loading',
  PENDING: 'pending',
  READY: 'ready',
  UNSUPPORTED: 'unsupported',
};

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
  return !!div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
}

export function randomString(length: number): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '1234567890';
  const charset = `${letters}${letters.toUpperCase()}${numbers}`;

  const randomCharacter = (character: string) =>
    character[Math.floor(Math.random() * character.length)];

  let R = '';
  for (let i = 0; i < length; i++) {
    R += randomCharacter(charset);
  }

  return R;
}

/**
 *  Remove properties from an object
 */
export function removeProperties<T extends PlainObject, K extends keyof T>(
  input: T,
  ...filter: K[]
): Omit<T, K> {
  const output: any = {};

  for (const key in input) {
    /* istanbul ignore else */
    if ({}.hasOwnProperty.call(input, key)) {
      if (!filter.includes((key as unknown) as K)) {
        output[key] = input[key];
      }
    }
  }

  return output;
}
