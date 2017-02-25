var gulp = require('gulp');
var runSequence = require('run-sequence');
var merge = require('merge2');
var del = require('del');

var fs = require('fs');

var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json', {
  declaration: true
});


gulp.task('default', function () {
  runSequence(
    'clean',
    'typescript',//-parser',
    'build-parser'
    //'typescript'
  );
});

gulp.task('clean', function () {
  return del([
    'lib/**/*'
  ]);
});

gulp.task('typescript-parser', function () {
  return gulp.src(['src/grammar.ts'])
    .pipe(ts())
    .pipe(gulp.dest('lib'));
});

gulp.task('build-parser', function () {
  var extend = function(child, parent) {
    for (var key in parent) {
      if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key];

    }
  }
  extend(global, require('util'));
  require('jison');
  var parser = require('./lib/grammar.js').parser.generate();

  fs.writeFileSync('lib/parser.js', parser);
});

gulp.task('typescript', function () {
  const tsResult = tsProject.src()
    .pipe(tsProject());

  return merge([
    tsResult.dts.pipe(gulp.dest('src/typings')),
    tsResult.js.pipe(gulp.dest('lib'))
  ]);
});
