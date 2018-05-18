const exec = require('exec');

exec('git branch', {cwd: project_path}, (stdout,err,stderr) => {
    console.log(err)

})