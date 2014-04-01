react-inlinesvg
===============

One of the reasons SVGs are awesome is because you can style them with CSS.
Unfortunately, this winds up not being too useful in practice because the CSS
has to be in the same document. This leaves you with two bad options:

1. Embed the CSS in the SVG document
    * Can't use your CSS preprocessors (LESS, SASS)
    * Can't target parent elements (button hover, etc.)
    * Makes maintenance difficult
2. Embed the SVG in your HTML
    * Bloats your HTML
    * SVGs can't be cached by browsers between pages.
    * A maintenance nightmare

But there's an alternative that sidesteps these issues: load the SVG with an XHR
request and then embed it in the document. That's what this component does.


Usage
-----

```
var isvg = require('react-inlinesvg');

<isvg src="/path/to/myfile.svg">
  Here's some optional content for browsers that don't support XHR or inline
  SVGs. You can use other React components here too. Here, I'll show you.
  <img src="/path/to/myfile.png" />
</isvg>
```


Props
-----

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>src</code></td>
    <td>string</td>
    <td>
      The URL of the SVG file you want to load.
    </td>
  </tr>
  <tr>
    <td><code>wrapper</code></td>
    <td>function</td>
    <td>
      A React class or other function that returns a component instance to be
      used as the wrapper component. Defaults to <code>React.DOM.span</code>.
    </td>
  </tr>
  <tr>
    <td><code>preloader</code></td>
    <td>function</td>
    <td>
      A React class or other function that returns a component instance to be
      shown while the SVG is loaded.
    </td>
  </tr>
  <tr>
    <td><code>onLoad</code></td>
    <td>function</td>
    <td>
      A callback to be invoked upon successful load.
    </td>
  </tr>
  <tr>
    <td><code>onError</code></td>
    <td>function</td>
    <td>
      A callback to be invoked if loading the SVG fails. This will receive a
      single argument: an instance of <code>InlineSVGError</code>, which has
      the following properties:

      <ul>
        <li><code>isHttpError</code></li>
        <li><code>isSupportedBrowser</code></li>
        <li><code>isConfigurationError</code></li>
        <li><code>statusCode</code> (present only if <code>isHttpError</code> is true)</li>
      </ul>
    </td>
  </tr>
</table>


CORS
----

If loading SVGs from another domain, you'll need to make sure it allows [CORS].


XSS Warning
-----------

This component places the loaded file into your DOM, so you need to be careful
about XSS attacks. Only load trusted content, and don't use unsanitized user
input to generate the `src`!


[CORS]: https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
