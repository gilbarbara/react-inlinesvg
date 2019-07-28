import { canUseDOM as canUseDOMFlag } from 'exenv';

export const canUseDOM = () => canUseDOMFlag;

export const supportsInlineSVG = () => {
  /* istanbul ignore next */
  if (!document) {
    return false;
  }

  const div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
};

// tslint:disable-next-line:no-shadowed-variable
export class InlineSVGError extends Error {
  public name: string;
  public message: string;
  public data?: object;

  constructor(message: string, data?: object) {
    super();

    this.name = 'InlineSVGError';
    this.message = message;
    this.data = data;

    return this;
  }
}

export const isSupportedEnvironment = () =>
  supportsInlineSVG() && typeof window !== 'undefined' && window !== null;

export const randomString = (length: number) => {
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
};
