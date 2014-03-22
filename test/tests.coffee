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
  it 'should should show children in case of erroror', (done) ->
    el = renderComponent isvg
      src: 'DOESNOTEXIST.svg'
      onError: ->
        if /MISSINGNO/.test el.innerHTML then done()
        else done new Error 'Missing fallback contents'
      (span null, '')
      (span null, 'MISSINGNO')
  it 'should load SVGs from a CORS-enabled domain', (done) ->
    el = renderComponent isvg
      src: 'http://localhost:1338/test/tiger.svg'
      onError: done
      onLoad: -> assertContainsSvg el, done
