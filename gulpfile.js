var path = require('path');

var merge = require('merge2');
var changed = require('gulp-changed');

var gulp = require('gulp');
var concat = require('gulp-continuous-concat');
var filter = require('gulp-filter');
var flatmap = require('gulp-flatmap');
var htmlmin = require('gulp-htmlmin');
var mustache = require('gulp-mustache');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

var cssnano = require('cssnano');

var browsersync = require('browser-sync').create();

var build = 'build/dslab';
var dist = '../gh-pages';

gulp.task('default', ['browser-sync', 'mustache', 'postcss', 'static']);

// -------------------------------------------------------------------
// browser-sync
// -------------------------------------------------------------------

gulp.task('browser-sync', function() {
  browsersync.init({
    server: {baseDir: './build'},
    port: 4000
  });
});

// -------------------------------------------------------------------
// Render html with mustache
// -------------------------------------------------------------------

gulp.task('mustache', function() {
  return gulp.src('./src/templates/*.mustache')
    .pipe(watch('./src/templates/*.mustache', {verbose: true}))
    .pipe(changed(build))
    .pipe(flatmap(function(stream, file) {
      var dirname = path.dirname(file.path);
      var stem = path.basename(file.path, '.mustache');
      return stream
        .pipe(mustache(path.join(dirname, stem + '.json')))
        .pipe(rename({
          dirname: ('index' == stem ? '' : stem),
          basename: 'index',
          extname: '.html'
        }));
    }))
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest(build))
    .pipe(browsersync.stream());
});

// -------------------------------------------------------------------
// Optimize CSS
// -------------------------------------------------------------------

gulp.task('postcss', function() {
  var processors = [
    cssnano({autoprefixer: {browsers: ['last 2 version'], add: true},
             discardComments: {removeAll: true}})
  ];

  var scss_stream = gulp.src('./src/css/*.scss')
        .pipe(watch('./src/css/*.scss', {verbose: true}))
        .pipe(sass())
        .pipe(concat('custom.css'));

  var css_stream = gulp.src('./src/css/*.css')
        .pipe(watch('./src/css/*.css', {verbose: true}))
        .pipe(concat('vender.css'));

  return merge([css_stream, scss_stream])
    .pipe(changed(path.join(build, 'css')))
    .pipe(concat('style.css'))
    .pipe(postcss(processors))
    .pipe(gulp.dest(path.join(build, 'css')))
    .pipe(browsersync.stream());
});

// -------------------------------------------------------------------
// Static assets
// -------------------------------------------------------------------

gulp.task('static', function() {
  var font_stream = gulp.src('./src/fonts/*')
        .pipe(watch('./src/fonts/*'))
        .pipe(changed(path.join(build, 'fonts')))
        .pipe(gulp.dest(path.join(build, 'fonts')));
  var img_stream = gulp.src('./src/img/*')
        .pipe(watch('./src/img/*'))
        .pipe(changed(path.join(build, 'img')))
        .pipe(gulp.dest(path.join(build, 'img')));
  var js_stream = gulp.src('./src/js/*')
        .pipe(watch('./src/js/*'))
        .pipe(changed(path.join(build, 'js')))
        .pipe(gulp.dest(path.join(build, 'js')));
  var bib_stream = gulp.src('./src/templates/*.bib')
        .pipe(watch('./src/templates/*.bib'))
        .pipe(changed(path.join(build, 'publication')))
        .pipe(gulp.dest(path.join(build, 'publication')));

  return merge([font_stream, img_stream, js_stream, bib_stream])
    .pipe(browsersync.stream());
});

// --------------------------------------------------------------------
// deploy
// --------------------------------------------------------------------

gulp.task('deploy', function() {
  return gulp.src('./build/dslab/**/**')
    .pipe(gulp.dest(dist));
});
