/*eslint-disable no-var, one-var, func-names, indent, prefer-arrow-callback, object-shorthand, no-console, newline-per-chained-call, one-var-declaration-per-line, vars-on-top  */
var gulp       = require('gulp'),
    browserify = require('browserify'),
    $          = require('gulp-load-plugins')(),
    cors       = require('cors'),
    source     = require('vinyl-source-stream');

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

gulp.task('watch', function() {
  gulp.watch('./src/**/*', ['build']);
});

gulp.task('build:node', function() {
  return gulp.src('./src/**/*.js')
    .pipe($.babel({
      presets: [
        'es2015',
        'react',
        'stage-1'
      ],
      plugins: [
        'add-module-exports',
        'transform-decorators-legacy'
      ]
    }))
    .pipe(gulp.dest('./lib'));
});

gulp.task('build:browser', function() {
  var bundler, stream;
  bundler = browserify({
    entries: './src/index.js',
    standalone: 'ReactInlineSVG'
  });
  stream = bundler.bundle();
  return stream
    .pipe(source('react-inlinesvg.js'))
    .pipe(gulp.dest('./standalone/'));
});

gulp.task('testserver', function() {
  return $.connect.server({
    root: [__dirname],
    port: 1337,
    livereload: false,
    middleware: function() {
      return [cors()];
    }
  });
});

gulp.task('xdomainserver', function() {
  return $.connect.server({
    root: [__dirname],
    port: 1338,
    livereload: false,
    middleware: function() {
      return [cors()];
    }
  });
});

gulp.task('build', ['build:node', 'build:browser']);

gulp.task('test', ['xdomainserver', 'testserver']);
