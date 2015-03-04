gulp = require 'gulp'
gutil = require 'gulp-util'
coffee = require 'gulp-coffee'
browserify = require 'gulp-browserify'
rename = require 'gulp-rename'
connect = require 'gulp-connect'
cors = require 'cors'
gbump = require 'gulp-bump'


gulp.task 'watch', ->
  gulp.watch './src/**/*', ['build']
  gulp.watch './test/**/*', ['build:tests']

bump = (type) ->
  gulp.src ['./bower.json', './package.json']
    .pipe gbump {type}
    .pipe gulp.dest './'

gulp.task 'bump:major', -> bump 'major'
gulp.task 'bump:minor', -> bump 'minor'
gulp.task 'bump:patch', -> bump 'patch'

gulp.task 'build:node', ->
  gulp.src './src/*.coffee'
    .pipe coffee(bare: true).on('error', gutil.log)
    .pipe gulp.dest('./lib')

gulp.task 'build:browser', ->
  gulp.src './src/index.coffee'
    .pipe coffee(bare: true).on('error', gutil.log)
    .pipe browserify
      standalone: 'ReactInlineSVG'
      transform: ['browserify-shim']
    .pipe rename('react-inlinesvg.js')
    .pipe gulp.dest('./standalone/')

gulp.task 'build:tests', ->
  gulp.src './test/**/*.?(lit)coffee'
    .pipe coffee().on('error', gutil.log)
    .pipe browserify
      transform: ['browserify-shim']
    .pipe gulp.dest('./test/')

# A server for the test page
gulp.task 'testserver', ->
  connect.server
    root: [__dirname]
    port: 1337
    livereload: false
    middleware: -> [cors()]

# A server with another port for testing CORS
gulp.task 'xdomainserver', ->
  connect.server
    root: [__dirname]
    port: 1338
    livereload: false
    middleware: -> [cors()]

gulp.task 'test', ['build:browser', 'build:tests', 'xdomainserver', 'testserver']
gulp.task 'build', ['build:node', 'build:browser']
