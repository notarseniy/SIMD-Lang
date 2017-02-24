var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');

gulp.task('default', function () {
  gulp.start(['typescript']);
});

gulp.task('typescript', function () {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('lib'));
});
