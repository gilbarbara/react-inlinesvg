import type { PlainObject } from '../types';

export function canUseDOM(): boolean {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}

export function isSupportedEnvironment(): boolean {
  return supportsInlineSVG() && typeof window !== 'undefined' && window !== null;
}

export async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  const [fileType] = (contentType ?? '').split(/ ?; ?/);

  if (response.status > 299) {
    throw new Error('Not found');
  }

  if (!['image/svg+xml', 'text/plain'].some(d => fileType.includes(d))) {
    throw new Error(`Content type isn't valid: ${fileType}`);
  }

  return response.text();
}

export function sleep(seconds = 1) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

export function supportsInlineSVG(): boolean {
  /* c8 ignore next 3 */
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
    if ({}.hasOwnProperty.call(input, key)) {
      if (!filter.includes(key as unknown as K)) {
        output[key] = input[key];
      }
    }
  }

  return output as Omit<T, K>;
}
