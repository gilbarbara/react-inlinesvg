# react-inlinesvg
# ===============

# Our dependencies.

React = require 'react'
once = require 'once'
httpplease = require 'httpplease'
ieXDomain = require 'httpplease/plugins/oldiexdomain'

{PropTypes} = React
{span} = React.DOM
http = httpplease.use ieXDomain

# An enum containing all the possible statuses of an isvg component. This is
# accessible via `InlineSVG.Status`.

Status =
  PENDING: 'pending'
  LOADING: 'loading'
  LOADED: 'loaded'
  FAILED: 'failed'
  UNSUPPORTED: 'unsupported'

# Utils
# -----
#
# A test to determine whether the browser supports inline SVGs.

supportsInlineSVG = once ->
  return false unless document
  div = document.createElement 'div'
  div.innerHTML = '<svg />'
  div.firstChild and div.firstChild.namespaceURI is 'http://www.w3.org/2000/svg'

# Wrap a function in a `setTimeout` call. This is used to guarantee async
# behavior, which can avoid unexpected errors.

delay = (fn) ->
  (args...) ->
    newFunc = -> fn args...
    setTimeout newFunc, 0
    return

# Our default support test.

isSupportedEnvironment = once ->
  (window?.XMLHttpRequest or window?.XDomainRequest) and supportsInlineSVG()

# Replaces the IDs in the provided string with document-unique IDs. This is
# obviously very naive, but is intended to provide a good-enough solution
# without adding too much overhead as would, for example, parsing as XML. See
# GH-3.

uniquifyIDs = do ->
  mkAttributePattern = (attr) -> "(?:(?:\\s|\\:)#{ attr })"
  idPattern =
    ///
    (?:                                    # Match ID declarations:
      (
        #{ mkAttributePattern 'id' }       #   The start of an attribute named "id"
      )
      ="
        ([^"]+)                            #   Our attribute value—match anything that isn't a quote.
      "                                    #   The end of the attribute
    )
    |                                      # ...OR...
    (?:                                    # Match IRI references:
      (
        #{ mkAttributePattern 'href' }
        |
        #{ mkAttributePattern 'role' }
        |
        #{ mkAttributePattern 'arcrole' }
      )
      ="                                   #   The start of an attribute
        \#                                 #   A literal # indicating this is an IRI reference
        ([^"]+)                            #   Our attribute value—match anything that isn't a quote.
      "                                    #   The end of the attribute
    )
    |                                      # ...OR...
    (?:                                    # Match FuncIRI references
      ="                                   #   The start of an attribute
        url\(                              #   The beginning of a FuncIRI
          \#                               #   A literal # indicating this is an IRI reference
          ([^\)]+)                         #   The id—match anything that isn't a closing paren
        \)                                 #   The end of the FuncIRI
      "                                    #   The end of the attribute
    )
    ///g
  (svgText, svgID) ->
    uniquifyID = (id) -> "#{ id }___#{ svgID }"
    svgText.replace idPattern, (m, p1, p2, p3, p4, p5) ->
      if p2 then "#{ p1 }=\"#{ uniquifyID p2 }\""
      else if p4 then "#{ p3 }=\"##{ uniquifyID p4 }\""
      else if p5 then "=\"url(##{ uniquifyID p5 })\""

# Generates a 32bit hash from the SVG path

getHash = (str) ->
  hash = 0
  return hash unless str
  for i in [0...str.length]
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash = hash & hash
  hash

# Errors
# ------
#
# A custom error used by the InlineSVG component. For ease of inspection, we have
# one error type with several flags that can be used to get information about the
# error type.

class InlineSVGError extends Error
  name: 'InlineSVGError'
  isSupportedBrowser: true
  isConfigurationError: false
  isUnsupportedBrowserError: false
  constructor: (@message) ->

# Utility functions for creating `InlineSVGError` instances.

createError = (message, attrs) ->
  err = new InlineSVGError message
  for own k, v of attrs
    err[k] = v
  err

unsupportedBrowserError = (message = 'Unsupported Browser') ->
  createError message,
    isSupportedBrowser: false
    isUnsupportedBrowserError: true

configurationError = (message) ->
  createError message, isConfigurationError: true

# The InlineSVG component

module.exports = me =
  React.createClass
    statics: {Status}
    displayName: 'InlineSVG'
    propTypes:
      wrapper: PropTypes.func
      src: PropTypes.string.isRequired
      className: PropTypes.string
      preloader: PropTypes.func
      onLoad: PropTypes.func
      onError: PropTypes.func
      supportTest: PropTypes.func
      uniquifyIDs: PropTypes.bool
    getDefaultProps: ->
      wrapper: span
      supportTest: isSupportedEnvironment
      uniquifyIDs: true
    getInitialState: ->
      status: Status.PENDING
    componentDidMount: ->
      return unless @state.status is Status.PENDING

      # Either load the SVG or trigger an error, simulating async behavior with
      # `delay` so as not to violate any implicit expectations in the user's
      # code which would be difficult to troubleshoot.
      if @props.supportTest()
        if @props.src then @setState status: Status.LOADING, @load
        else do delay => @fail configurationError 'Missing source'
      else
        do delay => @fail unsupportedBrowserError()
    fail: (error) ->
      status = if error.isUnsupportedBrowserError then Status.UNSUPPORTED else Status.FAILED
      @setState {status}, => @props.onError? error
    handleLoad: (err, res) ->
      return @fail err if err

      # If the component has been unmounted since we started the load, just
      # forget it. (Setting the state of an unmounted component causes an
      # error.)
      return unless @isMounted()

      # Update the state to include the loaded text. This will be rendered to
      # the DOM the next time `render()` runs.
      @setState
        loadedText: res.text
        status: Status.LOADED
        => @props.onLoad?()
    load: ->
      if m = @props.src.match /data:image\/svg[^,]*?(;base64)?,(.*)/
        text =
          if m[1] then atob m[2]
          else decodeURIComponent m[2]
        @handleLoad null, {text}
      else
        http.get @props.src, @handleLoad
    getClassName: ->
      # Build a CSS class name based on the current state.
      className = "isvg #{ @state.status }"
      className += " #{ @props.className }" if @props.className
      className
    render: ->
      (@props.wrapper
        className: @getClassName()
        dangerouslySetInnerHTML: __html: @processSVG(@state.loadedText) if @state.loadedText
        @renderContents()
      )
    processSVG: (svgText) ->
      if @props.uniquifyIDs then uniquifyIDs svgText, getHash @props.src
      else svgText

    renderContents: ->
      switch @state.status
        when Status.UNSUPPORTED then @props.children
        when Status.PENDING, Status.LOADING
          new @props.preloader if @props.preloader
