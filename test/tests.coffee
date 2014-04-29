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
