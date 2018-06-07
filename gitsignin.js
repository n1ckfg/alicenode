const { exec, execSync, spawn, spawnSync, fork } = require('child_process');


let username = process.argv[2]

if (username = "michael") {

    exec('git config --global user.name "Michael Palumbo"')
    exec('git config --global user.email "emailmichaelpalumbo@gmail.com"')
    exec('git config --global user.email', (stdout) => {
        console.log(stdout)
    })
}