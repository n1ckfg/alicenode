function pruneWorktree() {
         // TO DO: where in the code are the worktrees counted or checked   
         // update the worktree list, if any worktrees had been removed by user, make sure they aren't
         // still tracked by git
         exec("git worktree prune", {cwd: project_path}, () => {
             // delete work tree (if it exists):
             if (fs.existsSync(worktreepath)) {
                 fs.unlinkSync(worktreepath);
             }
         })
     }