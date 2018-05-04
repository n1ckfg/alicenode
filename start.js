const { fork } = require("child_process");
const chokidar = require('chokidar');
const terminate = require('terminate');
const os = require("os");
const find = require('find-process');

let proc;

function killAlice() {
    let alice = os.type == "Darwin" ? "alice" : "alice.exe";
    find('name', alice).then(function (list) {
        let pidList = list.map(a => a.pid)
        pidList.forEach(function(element) {
            terminate(element, function (err) {
                if (err) { // you will get an error if you did not supply a valid process.pid 
                    console.log("pidTerminate: " + err); // handle errors in your preferred way. 
                } else {
                    console.log('done'); // terminating the Processes succeeded. 
                }
            });
        })
    });
}

function launch() {
	console.log("-------------------------------------------------------------");
    proc = fork("server.js", [], {});
    proc.on("exit", function(code) {
        console.log("START exit code", code);
        killAlice();
        if (code == null || code) {
            launch();
        } else {
            process.exit(0);
        }
    });
}

let watcher = chokidar.watch("server.js")
.on('error', error => console.log(`Watcher error: ${error}`))
.on('change', (filepath, stats) => {
    console.log("changed", filepath);
    if (proc) { 
        proc.kill();
        killAlice();
    }
});

launch();