/*eslint-disable no-var, func-names, prefer-arrow-callback, object-shorthand, require-jsdoc, vars-on-top  */
var gulp = require('gulp');
var browserify = require('browserify');
var $ = require('gulp-load-plugins')();
var cors = require('cors');
var source = require('vinyl-source-stream');

function bump(type) {
  return gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({ type: type }))
    .pipe(gulp.dest('./'));
}

gulp.task('bump:major', function() {
  return bump('major');
});

gulp.task('bump:minor', function() {
  return bump('minor');
});

gulp.task('bump:patch', function() {
  return bump('patch');
});

gulp.task('build', function() {
  process.env.NODE_ENV = 'production';
  process.env.BABEL_ENV = 'commonjs';

  var bundler;
  var stream;

  bundler = browserify({
    entries: './src/index.js',
    standalone: 'ReactInlineSVG'
  });

  stream = bundler.bundle();

  return stream
    .pipe(source('react-inlinesvg.js'))
    .pipe(gulp.dest('./standalone/'));
});

gulp.task('server', ['server:local', 'server:xdomain']);

gulp.task('server:local', function() {
  return $.connect.server({
    root: [__dirname],
    port: 1337,
    livereload: false,
    middleware: function() {
      return [cors()];
    }
  });
});

gulp.task('server:xdomain', function() {
  return $.connect.server({
    root: [__dirname],
    port: 1338,
    livereload: false,
    middleware: function() {
      return [cors()];
    }
  });
});
