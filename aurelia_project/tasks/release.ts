import * as gulp from 'gulp';
import * as changedInPlace from 'gulp-changed-in-place';
import * as merge from 'merge-stream';

export default function release() {

  const taskScripts = gulp.src(`scripts/**/*`)
                      .pipe(changedInPlace({firstPass: true}))
                      .pipe(gulp.dest(`release/scripts`));

  const taskIndex = gulp.src([`index.html`, `favicon.ico`])
                        .pipe(changedInPlace({firstPass: true}))
                        .pipe(gulp.dest(`release/`));
  
  return merge(taskScripts, taskIndex);
}
