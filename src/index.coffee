React = require 'react'
once = require 'once'

{PropTypes} = React
{span} = React.DOM


supportsInlineSVG = once ->
  return false unless document
  div = document.createElement 'div'
  div.innerHTML = '<svg />'
  div.firstChild and div.firstChild.namespaceURI is 'http://www.w3.org/2000/svg'

XHR = do ->
  return null unless window
  return XHR if (XHR = window.XMLHttpRequest) and 'withCredentials' of new XHR
  return window.XDomainRequest

isSupportedEnvironment = once -> XHR and supportsInlineSVG()

Status =
  PENDING: 'pending'
  LOADING: 'loading'
  LOADED: 'loaded'
  FAILED: 'failed'

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
    getDefaultProps: ->
      wrapper: span
    getInitialState: ->
      status: Status.PENDING
    componentDidMount: ->
      return unless @state.status is Status.PENDING
      @load()
    getContents: ->
      switch @state.status
        when Status.FAILED then @props.children
        when Status.PENDING, Status.LOADING
          new @props.preloader if @props.preloader
    fail: (error) ->
      @setState status: Status.FAILED, => @props.onError? error
    handleResponse: (txt) ->
      @setState
        loadedText: txt
        status: Status.LOADED
        => @props.onLoad?()
    load: ->
      unless @props.src and isSupportedEnvironment()
        @fail new Error 'Unsupported Browser'
        return

      xhr = new XHR()
      xhr.onreadystatechange = =>
        return if xhr.readyState isnt 4
        xhr.onreadystatechange = null
        switch xhr.status
          when 200 then @handleResponse xhr.responseText
          else @fail new Error "Request failed with a status of #{ xhr.status }"

      xhr.open 'GET', @props.src
      xhr.send()

    getClassName: ->
      className = "isvg #{ @state.status }"
      className += @props.className if @props.className
      className += 'unsupported-browser' unless isSupportedEnvironment()
      className
    render: ->
      if @state.status is Status.LOADED
        (@props.wrapper
          className: @getClassName()
          dangerouslySetInnerHTML: __html: @state.loadedText
        )
      else
        (@props.wrapper
          className: @getClassName()
          @getContents()
        )
