# react-inlinesvg

[![NPM version](https://badge.fury.io/js/react-inlinesvg.svg)](https://www.npmjs.com/package/react-inlinesvg) [![build status](https://travis-ci.org/gilbarbara/react-inlinesvg.svg)](https://travis-ci.org/gilbarbara/react-inlinesvg) [![Maintainability](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/maintainability)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/test_coverage)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/test_coverage)

Load inline, local or remote SVGs in your React components.  
Async requests will be cached.

## Usage

```bash
npm i react-inlinesvg
```

And import it into your code:

```jsx
import React from 'react';
import SVG from 'react-inlinesvg';

const Icon = () => <SVG src="/path/to/myfile.svg" />;
```

## Props

**src** {string} - **required**.  
The SVG file you want to load. It can be an `url` or a string (base64 or encoded).

**baseURL** {string}  
An URL to prefix each ID in case you are using the `<base>` tag and `uniquifyIDs`.

**cacheRequests** {boolean} ▶︎ `true`  
Cache remote SVGs.

**description** {string}  
A description for your SVG. It will override an existing `<desc>` tag.

**innerRef** {React.Ref|function}  
Get the SVG HTMLElement.

**loader** {node}  
A component to be shown while the SVG is loading.

**onError** {function}  
A callback to be invoked if loading the SVG fails.  
This will receive a single argument with:

- a `FetchError` with:

```js
{
  message: string;
  type: string;
  errno: string;
  code: string;
}
```

- or an `InlineSVGError`, which has the following properties:

```js
{
    name: 'InlineSVGError',
    data?: object,
    message: string
}
```

**onLoad** {function}.  
A callback to be invoked upon successful load.  
This will receive 2 arguments: the `src` prop and a `hasCache` boolean

**preProcessor** {function} ▶︎ `string`  
A function to process the contents of the SVG text before parsing.

**title** {string}  
A title for your SVG. It will override an existing `<title>` tag.

**uniqueHash** {string} ▶︎ a random 8 characters string `[A-Za-z0-9]`  
A string to use with `uniquifyIDs`.

**uniquifyIDs** {boolean} ▶︎ `false`  
Create unique IDs for each icon.

> Additional props will be spread over the SVG element.

### Example

```jsx
<SVG
  baseURL="/home"
  cacheRequests={true}
  description="The React logo"
  loader={() => <span>Loading...</span>}
  onError={error => console.log(error.message)}
  onLoad={(src, hasCache) => console.log(src, hasCache)}
  preProcessor={code => code.replace(/fill=".*?"/g, 'fill="currentColor"')}
  src="https://cdn.svgporn.com/logos/react.svg"
  title="React"
  uniqueHash="a1f8d1"
  uniquifyIDs={true}
/>
```

## Browser Support

Any browsers that support inlining [SVGs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) will work.
If you need to support legacy browsers you'll need to include a polyfiil in your app.  
Take a look at [react-app-polyfill](https://www.npmjs.com/package/react-app-polyfill).

## CORS

If loading SVGs from another domain, you'll need to make sure it allows [CORS].

[cors]: https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
[svg-use-external-source]: http://css-tricks.com/svg-use-external-source
[use-article]: http://taye.me/blog/svg/a-guide-to-svg-use-elements/
[use-support]: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use#Browser_compatibility

## Why you need this package?

One of the reasons SVGs are awesome is because you can style them with CSS.
Unfortunately, this winds up not being too useful in practice because the style element has to be in the same document. This leaves you with three bad options:

1. Embed the CSS in the SVG document
   - Can't use your CSS preprocessors (LESS, SASS)
   - Can't target parent elements (button hover, etc.)
   - Makes maintenance difficult
2. Link to a CSS file in your SVG document
   - Sharing styles with your HTML means duplicating paths across your project, making maintenance a pain
   - Not sharing styles with your HTML means extra HTTP requests (and likely
     duplicating paths between different SVGs)
   - Still can't target parent elements
   - Your SVG becomes coupled to your external stylesheet, complicating reuse.
3. Embed the SVG in your HTML
   - Bloats your HTML
   - SVGs can't be cached by browsers between pages.
   - A maintenance nightmare

But there's an alternative that sidesteps these issues: load the SVG with a GET request and then embed it in the document. This is what this component does.

### Note

The SVG [`<use>`][svg-use-external-source] element can be used to achieve something similar to this component. See [this article][use-article] for more information and [this table][use-support] for browser support and caveats.

## Credits

Thanks to [@matthewwithanm](https://github.com/matthewwithanm) for creating this component and so kindly transfer it to me.
I'll definitely keep the good work! ❤️
