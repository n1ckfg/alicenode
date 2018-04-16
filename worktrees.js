const { exec, execSync, spawn, spawnSync, fork } = require('child_process');


exec("git worktree list --porcelain", (stderr, err) => {

var lines = err.toString().split('\n');
var results = new Array();
lines.forEach(function(line) {
    var parts = line.split('=');
    results[parts[0]] = parts[1];
    console.log(line[1])
});

//console.log(results[parts]);

})