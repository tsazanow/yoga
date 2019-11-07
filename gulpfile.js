"use strict";

var gulpversion = '4';

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var minify = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var posthtml = require("gulp-posthtml");
var htmlmin = require("gulp-htmlmin");
var uglify = require("gulp-uglify");
var pump = require("pump");
var include = require("posthtml-include");
var run = require("run-sequence");
var del = require("del");
var server = require("browser-sync").create();

gulp.task("images", function () {
  return gulp.src(["source/img/**/*.{png,jpg,svg}", "!source/img/sprite.svg"])
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("build"));
});

gulp.task("compress", function (cb) {
  pump([
    gulp.src("source/js/*.js"),
    uglify(),
    rename({ suffix: ".min" }),
    gulp.dest("build/js")
  ],
    cb()
  );
});

if (gulpversion == 3) {
  gulp.task("style", function () {
    gulp.src("source/scss/style.scss")
      .pipe(plumber())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer()
      ]))
      .pipe(gulp.dest("build/css"))
      .pipe(minify())
      .pipe(rename("style.min.css"))
      .pipe(gulp.dest("build/css"))
      .pipe(server.stream());
  });

  gulp.task("serve", function() {
    server.init({
      server: "build/",
      notify: false,
      open: true,
      cors: true,
      ui: false
    });

    gulp.watch("source/scss/**/*.scss", ["style"]).on("change", server.reload);
    gulp.watch("source/*.html", ["html"]).on("change", server.reload);
  });

  gulp.task("build", function(done) {
    run(
      "clean",
      "copy",
      "style",
      "compress",
      "images",
      "html",
       done
    );
  });
};

if (gulpversion == 4) {
  gulp.task("style", gulp.series(function(cb) {
    gulp.src("source/scss/style.scss")
      .pipe(plumber())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer()
      ]))
      .pipe(gulp.dest("build/css"))
      .pipe(minify())
      .pipe(rename("style.min.css"))
      .pipe(gulp.dest("build/css"))
      .pipe(server.stream())
      cb()
  }));

  gulp.task("serve", function() {
    server.init({
      server: "build/",
      notify: false,
      open: true,
      cors: true,
      ui: false
    });

    gulp.watch("source/scss/**/*.scss", gulp.parallel("style")).on("change", server.reload);
    gulp.watch("source/*.html", gulp.parallel("html")).on("change", server.reload);
  });

  gulp.task("build", function (done) {
    gulp.series(
      "clean",
      "copy",
      "style",
      "compress",
      "images",
      "html"
      )(done)
  });
};

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2,eot,ttf}",
    "source/img/**",
    "source/js/**",
  ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function () {
  return del("build");
});
