# react-inlinesvg

[![NPM version](https://badge.fury.io/js/react-inlinesvg.svg)](https://www.npmjs.com/package/react-inlinesvg) [![CI](https://github.com/gilbarbara/react-inlinesvg/actions/workflows/ci.yml/badge.svg)](https://github.com/gilbarbara/react-inlinesvg/actions/workflows/ci.yml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_react-inlinesvg&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gilbarbara_react-inlinesvg) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_react-inlinesvg&metric=coverage)](https://sonarcloud.io/summary/new_code?id=gilbarbara_react-inlinesvg)

Load inline, local, or remote SVGs in your React components.

View the [demo](https://codesandbox.io/s/github/gilbarbara/react-inlinesvg/tree/main/demo)

## Highlights

- 🏖 **Easy to use:** Just set the `src`
- 🛠 **Flexible:** Personalize the options to fit your needs
- ⚡️ **Smart:** Async requests will be cached.
- 🚀 **SSR:** Safe for server-side rendering

## Usage

```sh
npm i react-inlinesvg
```

And import it into your code:

```tsx
import SVG from 'react-inlinesvg';

export default function App() {
  return (
    <main>
      <SVG
        src="https://cdn.svglogos.dev/logos/react.svg"
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
The SVG to load. It accepts:

- A URL or path to an SVG file (absolute or relative, including from a bundler import)
- A data URI (base64 or URL-encoded)
- A raw SVG string

**baseURL** {string}
A URL to prepend to `url()` references inside the SVG when using `uniquifyIDs`. Required if your page uses an HTML `<base>` tag.

**children** {ReactNode}  
The fallback content in case of a fetch error or unsupported browser.

```
<SVG src="...">
	<img src="..." alt="fallback" />
</SVG>
```

**cacheRequests** {boolean} ▶︎ `true`
Cache remote SVGs in memory. When used with the [CacheProvider](#caching), requests are also persisted in the browser cache.

**description** {string}  
A description for your SVG. It will override an existing `<desc>` tag.

**fetchOptions** {RequestInit}  
Custom options for the [request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request).

**innerRef** {React.Ref\<SVGElement | null>}
Set a ref on the SVG element.  

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

- or an `Error` for issues like missing `src`, unsupported browser, or invalid SVG content.

**onLoad** {function}.  
A callback to be invoked upon successful load.  
This will receive 2 arguments: the `src` prop and an `isCached` boolean

**preProcessor** {function}
A function to pre-process the SVG string before parsing. Receives the SVG string and must return a string.

**title** {string | null}  
A title for your SVG. It will override an existing `<title>` tag.  
If `null` is passed, the `<title>` tag will be removed.

**uniqueHash** {string} ▶︎ a random 8 characters string `[A-Za-z0-9]`  
A string to use with `uniquifyIDs`.

**uniquifyIDs** {boolean} ▶︎ `false`  
Create unique IDs for each icon.

> Any additional props will be passed down to the SVG element.

### Example

```tsx
<SVG
  baseURL="/home"
  cacheRequests={true}
  description="The React logo"
  loader={<span>Loading...</span>}
  onError={(error) => console.log(error.message)}
  onLoad={(src, isCached) => console.log(src, isCached)}
  preProcessor={(code) => code.replace(/fill=".*?"/g, 'fill="currentColor"')}
  src="https://cdn.svglogos.dev/logos/react.svg"
  title="React"
  uniqueHash="a1f8d1"
  uniquifyIDs={true}
/>
```

## Caching

You can use the browser's cache to store the SVGs permanently.  
To set it up, wrap your app with the cache provider:

```tsx
import { createRoot } from 'react-dom/client';
import CacheProvider from 'react-inlinesvg/provider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <CacheProvider>
    <App />
  </CacheProvider>
);
```

The `CacheProvider` accepts an optional `name` prop to customize the cache storage name.

> Be aware of the limitations of the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).

## Browser Support

Any browser that supports inlining [SVGs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) will work.

If you need to support legacy browsers, include a polyfill for `fetch` in your app.

## CORS

If you are loading remote SVGs, you must ensure they have [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) headers.

## Why do you need this package?

One reason SVGs are awesome is that you can style them with CSS.
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

The SVG [`<use>`](https://css-tricks.com/svg-use-external-source/) element can be used to achieve something similar to this component. See [this article](https://taye.me/blog/svg/a-guide-to-svg-use-elements) for more information and [this table](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use#Browser_compatibility) for browser support and caveats.

## Credits

Thanks to [@matthewwithanm](https://github.com/matthewwithanm) for creating this component and so kindly transferring it to me.
I'll definitely keep up the good work! ❤️
