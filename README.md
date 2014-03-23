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
isvg = require 'react-inlinesvg'

<isvg src="/path/to/myfile.svg">
  Here's some optional content for browsers that don't support XHR or inline
  SVGs. You can use other React components here too. Here, I'll show you.
  <img src="/path/to/myfile.png" />
</isvg>
```


CORS
----

If loading SVGs from another domain, you'll need to make sure it allows [CORS].


XSS Warning
-----------

This component places the loaded file into your DOM, so you need to be careful
about XSS attacks. Only load trusted content, and don't use unsanitized user
input to generate the `src`!


[CORS]: https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
