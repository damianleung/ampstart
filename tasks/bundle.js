/**
 * Copyright 2017 The AMPStart Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const gulp = require('gulp-help')(require('gulp'));
const util = require('gulp-util');
const exec = require('child_process').execSync;
const jsdom = require('jsdom');
const through = require('through2');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');

function collectResources(filepath, html, done) {
  const filename = path.basename(filepath, '.amp.html');
  const env = jsdom.env(html, function(err, window) {
    const ampimgs = window.document.querySelectorAll('amp-img[src]');
    const imgs = [].slice.call(ampimgs).map(function(el) {
      const src = el.getAttribute('src');
      const abspath = path.resolve(path.dirname(filepath), src);
      return abspath.replace(`${process.cwd()}/`, '');
    });
    const name = filepath.replace(`${process.cwd()}/`, '');
    imgs.forEach(function(imgpath) {
      fs.copySync(imgpath, `.archive/${imgpath.replace(/^dist/, filename)}`);
    });
    fs.copySync(filepath,
        `.archive/${filename}/templates/${path.basename(filepath)}`);

    exec(`cd .archive && zip -r ../dist/archive/${filename}.zip ${filename}/`);
    done();
  });
}


function bundle() {
  fs.removeSync('.archive');
  fs.mkdirSync('.archive');

  fs.removeSync('dist/archive');
  fs.mkdirSync('dist/archive');

  return gulp.src(`${config.dest.templates}/templates/**/*.html`)
      .pipe(through.obj(function(file, enc, cb) {
        if (file.isNull()) {
          cb(null, file);
          return;
        }
        const resources = collectResources(
            file.path, file.contents.toString(), cb.bind(null, null, file));
      })).on('end', function() {
        fs.removeSync('.archive');
      });
}

gulp.task('bundle', bundle);
