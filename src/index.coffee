# react-inlinesvg
# ===============

# Our dependencies.

React = require 'react'
once = require 'once'

{PropTypes} = React
{span} = React.DOM

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
      status = if not error.isSupportedBrowser then Status.UNSUPPORTED else Status.FAILED
      @setState {status}, => @props.onError? error
    handleResponse: (txt) ->
      # Update the state to include the loaded text. This will be rendered to
      # the DOM the next time `render()` runs.
      @setState
        loadedText: txt
        status: Status.LOADED
        => @props.onLoad?()
    load: ->
      xhr = new XHR()

      # Because XHR can be an XMLHttpRequest or an XDomainRequest, we add
      # `onreadystatechange`, `onload`, and `onerror` callbacks. We use the
      # `once` util to make sure that only one is called (and it's only called
      # one time).
      done = once delay (err) =>
        xhr.onload = xhr.onerror = xhr.onreadystatechange = null
        if err then @fail err
        else @handleResponse xhr.responseText

      # When the request completes, continue.
      xhr.onreadystatechange = =>
        if xhr.readyState is 4
          switch xhr.status.toString()[...1]
            when '2' then done()
            when '4' then done httpError 'Client Error', xhr.status
            when '5' then done httpError 'Server Error', xhr.status
            else done httpError 'HTTP Error', xhr.status

      # `onload` is only called on success and, in IE, will be called without
      # `xhr.status` having been set, so we don't check it.
      xhr.onload = -> done()
      xhr.onerror = -> done httpError 'Internal XHR Error', xhr.status or 0

      # Send the request.
      xhr.open 'GET', @props.src
      xhr.send()
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

# Get the XHR class to use. This is necessary to support IE9, which only supports
# CORS via its proprietary `XDomainRequest` object.

XHR = do ->
  return null unless window?
  return XHR if (XHR = window.XMLHttpRequest) and 'withCredentials' of new XHR
  return window.XDomainRequest

# Wrap a function in a `setTimeout` call. This is used to guarantee async
# behavior, which can avoid unexpected errors.

delay = (fn) ->
  (args...) ->
    newFunc = -> fn args...
    setTimeout newFunc, 0
    return

# Our default support test.

isSupportedEnvironment = once -> XHR and supportsInlineSVG()


# Errors
# ------
#
# A custom error used by the InlineSVG component. For ease of inspection, we have
# one error type with several flags that can be used to get information about the
# error type.

class InlineSVGError extends Error
  name: 'InlineSVGError'
  isHttpError: false
  isSupportedBrowser: true
  isConfigurationError: false
  constructor: (@message) ->

# Utility functions for creating `InlineSVGError` instances.

createError = (message, attrs) ->
  err = new InlineSVGError message
  for own k, v of attrs
    err[k] = v
  err

httpError = (message, statusCode) ->
  createError message, isHttpError: true, statusCode: statusCode

unsupportedBrowserError = (message = 'Unsupported Browser') ->
  createError message, isSupportedBrowser: false

configurationError = (message) ->
  createError message, isConfigurationError: true
