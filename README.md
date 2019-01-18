# react-inlinesvg

[![NPM version](https://badge.fury.io/js/react-inlinesvg.svg)](https://www.npmjs.com/package/react-inlinesvg) 
[![build status](https://travis-ci.org/gilbarbara/react-inlinesvg.svg)](https://travis-ci.org/gilbarbara/react-inlinesvg) 
[![dependencies Status](https://david-dm.org/gilbarbara/react-inlinesvg/status.svg)](https://david-dm.org/gilbarbara/react-inlinesvg) 
[![Maintainability](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/maintainability)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/maintainability) 
[![Test Coverage](https://api.codeclimate.com/v1/badges/c7e42fe511b80cc25760/test_coverage)](https://codeclimate.com/github/gilbarbara/react-inlinesvg/test_coverage)

One of the reasons SVGs are awesome is because you can style them with CSS.
Unfortunately, this winds up not being too useful in practice because the style
element has to be in the same document. This leaves you with three bad options:

1. Embed the CSS in the SVG document
    * Can't use your CSS preprocessors (LESS, SASS)
    * Can't target parent elements (button hover, etc.)
    * Makes maintenance difficult
2. Link to a CSS file in your SVG document
    * Sharing styles with your HTML means duplicating paths across your project,
      making maintenance a pain
    * Not sharing styles with your HTML means extra HTTP requests (and likely
      duplicating paths between different SVGs)
    * Still can't target parent elements
    * Your SVG becomes coupled to your external stylesheet, complicating reuse.
3. Embed the SVG in your HTML
    * Bloats your HTML
    * SVGs can't be cached by browsers between pages.
    * A maintenance nightmare

But there's an alternative that sidesteps these issues: load the SVG with an XHR
request and then embed it in the document. That's what this component does.


### Note

The SVG [`<use>`][svg-use-external-source] element can be used to achieve
something similar to this component. See [this article][use-article] for more
information and [this table][use-support] for browser support and caveats.

Usage
----
First install it.

`npm i react-inlinesvg`

And import it into your code:


```jsx
import SVG from 'react-inlinesvg';

<SVG
    src="/path/to/myfile.svg"
    preloader={<Loader />}
    onLoad={(src) => {
        myOnLoadHandler(src);
    }}
>
  Here's some optional content for browsers that don't support XHR or inline
  SVGs. You can use other React components here too. Here, I'll show you.
  <img src="/path/to/myfile.png" />
</SVG>
```


Props
----

**src** {string}  
The SVG file you want to load. It can be an `url` or a string (base64 or encoded)

**wrapper** {function} ▶︎ `React.createFactory('span')`  
A React class or a function that returns a component instance to be used as the wrapper component.

**preloader** {node}  
A component to be shown while the SVG is loading.

**className** {string}  
A class to add to the default wrapper.

**cacheGetRequests** {boolean} ▶︎ `false`
Only request SVGs once.

**uniquifyIDs** {boolean} ▶︎ `true`  
Create unique IDs for each icon.

**uniqueHash** {string}  
A string to use with `uniquifyIDs`.

**baseURL** {string}
An URL to prefix each ID in case you are using the `<base>` tag.

**processSVG** {function} ▶︎ `string`
A function to process the contents of the SVG text before rendering.

**onLoad** {function} ▶︎ a random 8 characters string `[A-Za-z0-9]`  
A callback to be invoked upon successful load.  
This will receive 2 arguments: the `src` prop and a `isCached` boolean

**onError** {function}  
A callback to be invoked if loading the SVG fails.  
This will receive a single argument:

- a xhr `RequestError` with:

```js
{
    ...,
    isHttpError: bool,
    status: number
}
```

- or an `InlineSVGError`, which has the following properties:

```js
{
    name: 'InlineSVGError',
    isSupportedBrowser: bool,
    isConfigurationError: bool,
    isUnsupportedBrowserError: bool,
    message: string
}
```


Browser Support
----

Any browsers that support inlining SVGs and XHR will work. The component goes out of its way to handle IE9's weird XHR support so, IE9 and up get your SVG;
lesser browsers get the fallback.
We use [httpplease](https://github.com/matthewwithanm/httpplease.js) for XHR requests.

CORS
----

If loading SVGs from another domain, you'll need to make sure it allows [CORS].


XSS Warning
----

This component places the loaded file into your DOM, so you need to be careful
about XSS attacks. Only load trusted content, and don't use unsanitized user
input to generate the `src`!


[CORS]: https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
[svg-use-external-source]: http://css-tricks.com/svg-use-external-source
[use-article]: http://taye.me/blog/svg/a-guide-to-svg-use-elements/
[use-support]: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use#Browser_compatibility


Credits
----
Thanks to [@matthewwithanm](https://github.com/matthewwithanm) for creating this component and so kindly transfer it to me.
I'll definitely keep the good work! ❤️
