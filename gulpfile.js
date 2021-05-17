const gulp = require("gulp");
const del = require("del");
gulp.task("default", () => del(["dist/**/*"]));
