# react-inlinesvg

[![NPM version](https://badge.fury.io/js/react-inlinesvg.svg)](https://www.npmjs.com/package/react-inlinesvg) [![Build Status](https://travis-ci.com/gilbarbara/react-inlinesvg.svg?branch=master)](https://travis-ci.com/gilbarbara/react-inlinesvg) [![Maintainability](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/maintainability)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/test_coverage)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/test_coverage)

Load inline, local or remote SVGs in your React components.

## Highlights

- 🏖 **Easy to use:** Just set the `src`
- 🛠 **Flexible:** Personalize the options to fit your needs
- ⚡️ **Smart:** Async requests will be cached.
- 🚀 **SSR:** Render a loader until the DOM is available
- 🟦 **Typescript:** Nicely typed

## Usage

```sh
npm i react-inlinesvg
```

And import it into your code:

```tsx
import React, { useRef } from 'react';
import SVG, { Props as SVGProps } from 'react-inlinesvg';

const Logo = React.forwardRef<SVGElement, SVGProps>((props, ref) => (
  <SVG innerRef={ref} title="MyLogo" {...props} />
));

export function App() {
  const logo = useRef<SVGElement>(null);

  return (
    <main>
      <SVG src={`${process.env.PUBLIC_URL}/menu.svg`} width={24} height="auto" title="Menu" />
      <Logo ref={logo} src={`${process.env.PUBLIC_URL}/logo.svg`} />
    </main>
  );
}
```

## Props

**src** {string} - **required**.  
The SVG file you want to load. It can be a require, URL or a string (base64 or url encoded).
_If you are using create-react-app and your file resides in the `public` directory you can use the path directly without require._

**baseURL** {string}  
An URL to prefix each ID in case you are using the `<base>` tag and `uniquifyIDs`.

**children** {ReactNode}  
The fallback content in case of a fetch error or unsupported browser.

```
<SVG src="...">
	<img src="..." alt="fallback" />
</SVG>
```

**cacheRequests** {boolean} ▶︎ `true`  
Cache remote SVGs.

**description** {string}  
A description for your SVG. It will override an existing `<desc>` tag.

**fetchOptions** {RequestInit}  
Custom options for the [request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request).

**innerRef** {React.Ref}  
Set a ref in SVGElement.

**loader** {node}  
A component to be shown while the SVG is loading.

**onError** {function}  
A callback to be invoked if loading the SVG fails.  
This will receive a single argument with:

- a `FetchError` with:

```typescript
{
  message: string;
  type: string;
  errno: string;
  code: string;
}
```

- or an `InlineSVGError`, which has the following properties:

```typescript
{
  name: 'InlineSVGError';
  data: object; // optional
  message: string;
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

> Any additional props will be passed down to the SVG element.

### Example

```jsx
<SVG
  baseURL="/home"
  cacheRequests={true}
  description="The React logo"
  loader={<span>Loading...</span>}
  onError={(error) => console.log(error.message)}
  onLoad={(src, hasCache) => console.log(src, hasCache)}
  preProcessor={(code) => code.replace(/fill=".*?"/g, 'fill="currentColor"')}
  src="https://cdn.svgporn.com/logos/react.svg"
  title="React"
  uniqueHash="a1f8d1"
  uniquifyIDs={true}
/>
```

## Caching

The internal cache is exported as `cacheStore` if you need to debug or pre-cache some files.  
⚠️ Use it at your own risk.

## Browser Support

Any browsers that support inlining [SVGs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) will work.

If you need to support legacy browsers you'll need to include a polyfiil for `fetch` and `Number.isNaN` in your app. Take a look at [react-app-polyfill](https://www.npmjs.com/package/react-app-polyfill) or [polyfill.io](https://polyfill.io/v3/).

## CORS

If you are loading remote SVGs, you'll need to make sure it has [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) support.

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
