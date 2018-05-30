function codeForensics() {
         if (process.argv[3] == "--forensics") {
         exec('gulp webserver', {cwd: __dirname});
         }
     }