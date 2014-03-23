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

delay = (fn) ->
  (args...) ->
    newFunc = -> fn args...
    setTimeout newFunc, 0
    return

isSupportedEnvironment = once -> XHR and supportsInlineSVG()

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
      if @props.supportTest()
        if @props.src then @setState status: Status.LOADING, @load
        else do delay => @fail new Error 'Missing source'
      else
        do delay => @fail new Error('Unsupported Browser'), Status.UNSUPPORTED
    fail: (error, status = Status.FAILED) ->
      @setState {status}, => @props.onError? error
    handleResponse: (txt) ->
      @setState
        loadedText: txt
        status: Status.LOADED
        => @props.onLoad?()
    load: ->
      xhr = new XHR()
      done = once delay (err) =>
        xhr.onload = xhr.onerror = xhr.onreadystatechange = null
        if err then @fail err
        else @handleResponse xhr.responseText
      xhr.onreadystatechange = =>
        if xhr.readyState is 4
          switch xhr.status.toString()[...1]
            when '2' then done()
            when '4' then done new Error "#{ xhr.status } Client Error"
            when '5' then done new Error "#{ xhr.status } Server Error"
            else done new Error "#{ xhr.status } HTTP Error"
      xhr.onload = -> done()
      xhr.onerror = -> done new Error 'Internal XHR error'
      xhr.open 'GET', @props.src
      xhr.send()

    getClassName: ->
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
