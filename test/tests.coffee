{assert} = chai
isvg = ReactInlineSVG
{span} = React.DOM


renderComponent = (component) ->
  div = document.createElement 'div'
  div.style.display = 'none'
  document.body.appendChild div
  React.renderComponent component, div
  div

assertContainsSvg = (el, done) ->
  if $(el).find('svg').length then done()
  else done new Error 'Missing SVG'

describe 'react-inlinesvg', ->
  it 'should load an svg', (done) ->
    el = renderComponent isvg
      src: 'tiger.svg'
      onError: done
      onLoad: -> assertContainsSvg el, done
  it 'should load a base64 data-uri', (done) ->
    el = renderComponent isvg
      # Material design icon
      # https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_play_arrow_24px.svg
      #
      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg=='
      onError: done
      onLoad: ->
        # Make sure variable "el" is populated before assertion
        setTimeout (-> assertContainsSvg el, done), 0
  it 'should load a non-base64 data-uri', (done) ->
    el = renderComponent isvg
      # Material design icon
      # https://github.com/google/material-design-icons/blob/master/av/svg/production/ic_play_arrow_24px.svg
      #
      src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A'
      onError: done
      onLoad: ->
        # Make sure variable "el" is populated before assertion
        setTimeout (-> assertContainsSvg el, done), 0
  it 'should call onError for a 404', (done) ->
    renderComponent isvg
      src: 'DOESNOTEXIST.svg'
      onError: -> done()
  it 'should load SVGs from a CORS-enabled domain', (done) ->
    el = renderComponent isvg
      src: 'http://localhost:1338/test/tiger.svg'
      onError: done
      onLoad: -> assertContainsSvg el, done
  it 'should should show children if loading not supported', (done) ->
    el = renderComponent isvg
      src: 'DOESNOTEXIST.svg'
      supportTest: -> false
      onError: (err) ->
        if /MISSINGNO/.test el.innerHTML then done()
        else done new Error 'Missing fallback contents'
      (span null, '')
      (span null, 'MISSINGNO')
  it 'should should NOT show children on error', (done) ->
    el = renderComponent isvg
      src: 'DOESNOTEXIST.svg'
      onError: ->
        if /MISSINGNO/.test el.innerHTML
          done new Error 'Children shown even though loading is supported'
        else done()
      (span null, 'MISSINGNO')

  describe 'errors', ->
    it 'should have a status code HTTP errors', (done) ->
      renderComponent isvg
        src: 'DOESNOTEXIST.svg'
        onError: (err) ->
          # This is actually functionality of the underlying HTTP library,
          # httpplease.
          if err.isHttpError and err.status is 404 then done()
          else done new Error 'Error missing information'
