'use strict';

const P = require('path');
const F = require('fs');
const D = require('del');

const merge = require('merge2');
const glob = require('glob');

const $ = require('gulp');
const $changed = require('gulp-changed');
const $concat = require('gulp-concat');
const $flatmap = require('gulp-flatmap');
const $if = require('gulp-if');
const $order = require('gulp-order');
const $ignore = require('gulp-ignore');
const $htmlmin = require('gulp-htmlmin');
const $mustache = require('gulp-mustache');
const $plumber = require('gulp-plumber');
const $postcss = require('gulp-postcss');
const $rename = require('gulp-rename');
const $rsync = require('gulp-rsync');
const $sass = require('gulp-sass');
const $uglify = require('gulp-uglify');

const cssnano = require('cssnano');

const browsersync = require('browser-sync').create();
const reload = (done) => {browsersync.reload(); done();};

const cfg = {
  des: './build/dslab'
};

$.task('default', $.series(
  () => D(['./build/dslab']), $.parallel(sync, watch)));

function watch() {
  $.watch('./src/pages/**/*', {ignoreInitial: false },
          $.series(pages, reload));
  $.watch('./src/assets/css/*', {ignoreInitial: false },
          $.series(styles, reload));
  $.watch('./src/assets/js/*', {ignoreInitial: false },
          $.series(scripts, reload));
  $.watch(['./src/assets/img/*', './src/assets/fonts/*'],
          {ignoreInitial: false }, $.series(misc, reload));
}

// -------------------------------------------------------------------
// browser-sync
// -------------------------------------------------------------------

function sync() {
  browsersync.init({
    server: './build',
    port: 4000
  });
}

// -------------------------------------------------------------------
// Render pages with mustache
// -------------------------------------------------------------------

function pages() {
  var cond = (
    () => {
      const cur = new Date();
      var i, ret = {};
      var deps = glob.sync('./src/pages/partials/*.mustache');
      var t0 = null;
      for (i = 0; i < deps.length; ++i)
        t0 = Math.max(t0, F.statSync(deps[i]).mtime);
      t0 = new Date(t0);
      try {
        var fd = F.openSync('./build', 'r');
      } catch (e) {
        fd = null;
      }
      var files = glob.sync('./src/pages/*.mustache');
      for (i = 0; i < files.length; ++i) {
        var k = P.basename(files[i], '.mustache');
        var t1 = F.statSync(P.join('./src/pages', k + '.json')).mtime;
        ret[k] = null === fd || cur - t0 < 1000 || cur - t1 < 1000;
      }
      return ret;
    })();

  return $.src('./src/pages/*.mustache')
    .pipe($if((file) => !cond[P.basename(file.path, '.mustache')],
              $changed(cfg.des)))
    .pipe($flatmap(function(stream, file) {
      var dirname = P.dirname(file.path);
      var stem = P.basename(file.path, P.extname(file.path));
      return stream
        .pipe($mustache(P.join(dirname, stem + '.json')))
        .pipe($rename({
          dirname: ('index' == stem ? '' : stem),
          basename: 'index',
          extname: '.html'}))
        .pipe($htmlmin({
          removeComments: true,
          collapseWhitespace: true,
          removeEmptyAttributes: true,
          minifyJS: true,
          minifyCSS: true}));}))
    .pipe($.dest(cfg.des));
}

// -------------------------------------------------------------------
// Make assets
// -------------------------------------------------------------------

function styles() {
  var processors = [
    cssnano({autoprefixer: {browsers: ['last 2 version'], add: true},
             discardComments: {removeAll: true}})
  ];
  return $.src('./src/assets/css/*')
    .pipe($order([
      "src/assets/css/*.css",
      "src/assets/css/*.scss"]))
    .pipe($changed('./build/dslab/css'))
    .pipe($if(file => P.extname(file.path) === '.scss', $sass()))
    .pipe($concat('style.css'))
    .pipe($postcss(processors))
    .pipe($.dest('./build/dslab/css'));
}

function scripts() {
  return $.src(['./src/assets/js/jquery.min.js',
                './src/assets/js/bootstrap.min.js'])
    .pipe($changed('./build/dslab/js'))
    .pipe($concat('script.js'))
    .pipe($.dest('./build/dslab/js'));
}

function misc() {
  var s0 = $.src(['./src/assets/**/*',
                  '!./src/assets/css/*', '!./src/assets/js/*'])
        .pipe($.dest(cfg.des));
  var s1 = $.src('./src/pages/*.bib')
        .pipe($changed('./build/dslab/publication'))
        .pipe($.dest('./build/dslab/publication'));
  return merge([s0, s1]);
};

// --------------------------------------------------------------------
// copy and deploy
// --------------------------------------------------------------------

$.task('copy', $.series(
  () => D(['docs'], {force: true}),
  () => $.src('build/dslab/**/*').pipe($.dest('docs'))));

$.task('deploy', function() {
  $.src('../gh-pages')
    .pipe($rsync({
      root: 'docs',
      hostname: 'mallard',
      destination: '/export/vol2/httpd/htdocs/academic/engineering/dslab',
      incremental: true,
      progress: true,
      compress: true,
      recursive: true,
      update: true,
      exclude: ['.git', '.gitignore', 'old']
    }));
});
