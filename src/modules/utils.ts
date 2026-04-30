import convert from 'react-from-dom';

import { Props, State } from '../types';

interface GetNodeOptions extends Props, Pick<State, 'content'> {
  handleError: (error: Error) => void;
  hash: string;
}

interface UpdateSVGAttributesOptions extends Pick<Props, 'baseURL' | 'uniquifyIDs'> {
  hash: string;
}

function uniquifyStyleIds(svgText: string, hash: string, baseURL: string): string {
  const idMatches = svgText.matchAll(/\bid=(["'])([^"']+)\1/g);
  const ids = [...new Set([...idMatches].map(m => m[2]))];

  if (!ids.length) {
    return svgText;
  }

  ids.sort((a, b) => b.length - a.length);

  return svgText.replace(/<style[^>]*>([\S\s]*?)<\/style>/gi, (fullMatch, cssContent) => {
    let modified = cssContent as string;

    for (const id of ids) {
      const escaped = id.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');

      modified = modified.replace(
        new RegExp(`url\\((['"]?)#${escaped}\\1\\)`, 'g'),
        `url($1${baseURL}#${id}__${hash}$1)`,
      );
      modified = modified.replace(
        new RegExp(`#${escaped}(?![a-zA-Z0-9_-])`, 'g'),
        `#${id}__${hash}`,
      );
    }

    return fullMatch.replace(cssContent, modified);
  });
}

export function getNode(options: GetNodeOptions) {
  const {
    baseURL,
    content,
    description,
    handleError,
    hash,
    preProcessor,
    title,
    uniquifyIDs = false,
  } = options;

  try {
    let svgText = preProcessor ? preProcessor(content) : content;

    if (uniquifyIDs) {
      svgText = uniquifyStyleIds(svgText, hash, baseURL ?? '');
    }

    const node = convert(svgText, { nodeOnly: true });

    if (!node || !(node instanceof SVGSVGElement)) {
      throw new Error('Could not convert the src to a DOM Node');
    }

    const svg = updateSVGAttributes(node, { baseURL, hash, uniquifyIDs });

    if (description) {
      const originalDesc = svg.querySelector('desc');

      if (originalDesc?.parentNode) {
        originalDesc.parentNode.removeChild(originalDesc);
      }

      const descElement = document.createElementNS('http://www.w3.org/2000/svg', 'desc');

      descElement.innerHTML = description;
      svg.prepend(descElement);
    }

    if (typeof title !== 'undefined') {
      const originalTitle = svg.querySelector('title');

      if (originalTitle?.parentNode) {
        originalTitle.parentNode.removeChild(originalTitle);
      }

      if (title) {
        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');

        titleElement.innerHTML = title;
        svg.prepend(titleElement);
      }
    }

    return svg;
  } catch (error: any) {
    return handleError(error);
  }
}

export function updateSVGAttributes(
  node: SVGSVGElement,
  options: UpdateSVGAttributesOptions,
): SVGSVGElement {
  const { baseURL = '', hash, uniquifyIDs } = options;
  const replaceableAttributes = ['id', 'href', 'xlink:href', 'xlink:role', 'xlink:arcrole'];
  const linkAttributes = ['href', 'xlink:href'];
  const isDataValue = (name: string, value: string) =>
    linkAttributes.includes(name) && (value ? !value.includes('#') : false);

  if (!uniquifyIDs) {
    return node;
  }

  [...node.children].forEach(d => {
    if (d.attributes?.length) {
      const attributes = Object.values(d.attributes).map(a => {
        const attribute = a;
        const match = /url\((.*?)\)/.exec(a.value);

        if (match?.[1]) {
          attribute.value = a.value.replace(match[0], `url(${baseURL}${match[1]}__${hash})`);
        }

        return attribute;
      });

      replaceableAttributes.forEach(r => {
        const attribute = attributes.find(a => a.name === r);

        if (attribute && !isDataValue(r, attribute.value)) {
          attribute.value = `${attribute.value}__${hash}`;
        }
      });
    }

    if (d.children.length) {
      return updateSVGAttributes(d as SVGSVGElement, options);
    }

    return d;
  });

  return node;
}
