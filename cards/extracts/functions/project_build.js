function project_build() {
         let out = "";
         if (process.platform == "win32") {
             out = execSync('build.bat "'+server_path+'"', { stdio:'inherit'});
         } else {
             out = execSync('sh build.sh "'+server_path+'"', { stdio:'inherit'});
         }
         console.log("built project", out.toString());
     }