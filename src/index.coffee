# react-inlinesvg
# ===============

# Our dependencies.

React = require 'react'
once = require 'once'
httpplease = require 'httpplease'
ieXDomain = require 'httpplease/lib/plugins/oldiexdomain'

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
    getDefaultProps: ->
      wrapper: span
      supportTest: isSupportedEnvironment
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
      console.log error
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
    load: -> http.get @props.src, @handleLoad
    getClassName: ->
      # Build a CSS class name based on the current state.
      className = "isvg #{ @state.status }"
      className += " #{ @props.className }" if @props.className
      className
    render: ->
      (@props.wrapper
        className: @getClassName()
        dangerouslySetInnerHTML: __html: @state.loadedText if @state.loadedText
        @renderContents()
      )
    renderContents: ->
      switch @state.status
        when Status.UNSUPPORTED then @props.children
        when Status.PENDING, Status.LOADING
          new @props.preloader if @props.preloader


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
