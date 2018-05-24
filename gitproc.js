//git processes

//get all commits containing specified filename. in particular interest: provide the ref (branch) of said commit
exec('git log --all --source --abbrev-commit --pretty=oneline -- build.sh', {cwd: project_path}, (stdout, stderr, err) => {
    console.log(stderr)
  })