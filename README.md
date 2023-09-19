# react-inlinesvg

[![NPM version](https://badge.fury.io/js/react-inlinesvg.svg)](https://www.npmjs.com/package/react-inlinesvg) [![CI](https://github.com/gilbarbara/react-inlinesvg/actions/workflows/main.yml/badge.svg)](https://github.com/gilbarbara/react-inlinesvg/actions/workflows/main.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_react-inlinesvg&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gilbarbara_react-inlinesvg) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_react-inlinesvg&metric=coverage)](https://sonarcloud.io/summary/new_code?id=gilbarbara_react-inlinesvg)

Load inline, local, or remote SVGs in your React components.

View the [demo](https://codesandbox.io/s/github/gilbarbara/react-inlinesvg/tree/main/demo)

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
import React from 'react';
import SVG from 'react-inlinesvg';

export default function App() {
  return (
    <main>
      <SVG
        src="https://cdn.svgporn.com/logos/react.svg"
        width={128}
        height="auto"
        title="React"
      />
    </main>
  );
}
```

## Props

**src** {string} - **required**.  
The SVG file you want to load. It can be a require, URL, or a string (base64 or URL encoded).
_If you are using create-react-app and your file resides in the `public` directory, you can use the path directly without require._

**baseURL** {string}  
An URL to prefix each ID in case you use the `<base>` tag and `uniquifyIDs`.

**children** {ReactNode}  
The fallback content in case of a fetch error or unsupported browser.

```
<SVG src="...">
	<img src="..." alt="fallback" />
</SVG>
```

**cacheRequests** {boolean} ▶︎ `true`  
Cache remote SVGs.  
Starting in version 4.x, you can also cache the files permanently, read more [below](#caching).

**description** {string}  
A description for your SVG. It will override an existing `<desc>` tag.

**fetchOptions** {RequestInit}  
Custom options for the [request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request).

**innerRef** {React.Ref}  
Set a ref in SVGElement.  

>The SVG is processed and parsed so the ref won't be set on the initial render.
You can use the `onLoad` callback to get and use the ref instead.

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
This will receive 2 arguments: the `src` prop and an `isCached` boolean

**preProcessor** {function} ▶︎ `string`  
A function to process the contents of the SVG text before parsing.

**title** {string | null}  
A title for your SVG. It will override an existing `<title>` tag.  
If `null` is passed, the `<title>` tag will be removed.

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
  onLoad={(src, isCached) => console.log(src, isCached)}
  preProcessor={(code) => code.replace(/fill=".*?"/g, 'fill="currentColor"')}
  src="https://cdn.svgporn.com/logos/react.svg"
  title="React"
  uniqueHash="a1f8d1"
  uniquifyIDs={true}
/>
```

## Caching

You can use the browser's cache to store the SVGs permanently.  
To set it up, wrap your app with the cache provider:

```typescript
import { createRoot } from 'react-dom/client';
import CacheProvider from 'react-inlinesvg/provider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <CacheProvider>
    <App />
  </CacheProvider>
);
```

> Be aware of the limitations of the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).

## Browser Support

Any browsers that support inlining [SVGs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) will work.

If you need to support legacy browsers, include a polyfill for `fetch` and `Number.isNaN` in your app. Take a look at [react-app-polyfill](https://www.npmjs.com/package/react-app-polyfill) or [polyfill.io](https://polyfill.io/v3/).

## CORS

If you are loading remote SVGs, you must ensure it has [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) support.

## Why do you need this package?

One of the reasons SVGs are awesome is that you can style them with CSS.
Unfortunately, this is not useful in practice because the style element has to be in the same document. This leaves you with three bad options:

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

The SVG [`<use>`](http://css-tricks.com/svg-use-external-source) element can be used to achieve something similar to this component. See [this article](http://taye.me/blog/svg/a-guide-to-svg-use-elements/) for more information and [this table](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use#Browser_compatibility) for browser support and caveats.

## Credits

Thanks to [@matthewwithanm](https://github.com/matthewwithanm) for creating this component and so kindly transferring it to me.
I'll definitely keep up the good work! ❤️
