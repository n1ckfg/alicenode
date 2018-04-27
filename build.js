const { exec } = require('child_process');
if (process.platform === 'darwin') {
   let cmd = exec("sh build.sh", {stdio:"inherit"});
   cmd.stdout.pipe(process.stdout);
   cmd.stderr.pipe(process.stderr);
   console.log("\n\n\nbuild " + process.stdout + " error " + process.stderr)
} else if (process.platform === 'win32') {
   let cmd = exec("build.bat", {stdio:"inherit"});
   cmd.stdout.pipe(process.stdout);
   cmd.stderr.pipe(process.stderr);
} else {
   throw new Error("Unsupported OS found: " + os.type());
}