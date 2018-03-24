/*eslint-disable no-var, func-names, prefer-arrow-callback, object-shorthand, require-jsdoc, vars-on-top  */
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var cors = require('cors');

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
