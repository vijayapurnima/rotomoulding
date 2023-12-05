import * as gulp from 'gulp';
import * as changedInPlace from 'gulp-changed-in-place';
import * as merge from 'merge-stream';
import * as project from '../aurelia.json';

export default function prepareMaterializeFont() {
  const source = 'node_modules/materialize-amd/dist';

  const taskCss = gulp.src(`${source}/css/materialize.css`)
  .pipe(changedInPlace({ firstPass: true }))
    .pipe(gulp.dest(`${project.platform.output}/css`));

  const taskFonts = gulp.src(`${source}/fonts/*`)
  .pipe(changedInPlace({ firstPass: true }))
    .pipe(gulp.dest(`${project.platform.output}/fonts`));

  return merge(taskCss,taskFonts);
}
