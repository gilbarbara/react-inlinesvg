gulp = require 'gulp'
gutil = require 'gulp-util'
coffee = require 'gulp-coffee'
browserify = require 'gulp-browserify'
rename = require 'gulp-rename'
connect = require 'gulp-connect'


gulp.task 'watch', ->
  gulp.watch './src/**/*', ['build']

bump = (type) ->
  gulp.src ['./bower.json', './package.json']
    .pipe bump {type}
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
  gulp.src './test/**/*.coffee'
    .pipe coffee().on('error', gutil.log)
    .pipe browserify
      transform: ['browserify-shim']
    .pipe gulp.dest('./test/')

gulp.task 'test', ['build:tests'],
  connect.server
    root: [__dirname]
    port: 1337
    livereload: true
    open:
      file: 'test/index.html'
      browser: 'Google Chrome'

gulp.task 'build', ['build:node', 'build:browser']
