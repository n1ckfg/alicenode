function git_add_and_commit() {
         try {
                     
             execSync('git add .', {cwd: project_path }, () => {console.log("git added")});
             execSync('git commit -m \"' + commitMsg + '\"', {cwd: project_path }, () => {console.log("git committed")});
             execSync('git status', {cwd: project_path }, (stdout) => {console.log("\n\n\n\n\n\n\n" + stdout)});
     
             // execSync("git log --pretty=format:'{%n “%H”: \"%aN <%aE>\", \"%ad\", \"%f\"%n},' $@ | perl -pe 'BEGIN{print \"[\"}; END{print \"]\n\"}' | perl -pe \'s/},]/}]/\' > " + path.join(client_path, "gitlog.json"), {cwd: server_path}, () => {
             // 	console.log("updated ../client/gitlog.json")
             // })
     
             //send_all_clients("updateRepo?");
     
             //exec('git rev-list --all --parents --timestamp -- test/sim.cpp > times.txt')
         } catch (e) {
             console.error(e.toString());
         }
     }