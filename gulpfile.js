const path = require("path");
var gulp = require('gulp');


gulp.task('default', function() {
  // place code for your default task here
});

require('code-forensics').configure(
  {
    repository: {
      rootPath: path.join("..", "alicenode_inhabitat"),
    }
  }
);