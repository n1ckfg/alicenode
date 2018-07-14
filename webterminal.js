const { exec, execSync, spawn, spawnSync, fork } = require('child_process')

exec("web-terminal --port 8081", (stdout) => {
    console.log(stdout)
  })