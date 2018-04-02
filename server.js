#!/usr/bin/env node

//const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');
const chokidar = require('chokidar');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const execPromise = require('child-process-promise');
const nodegit = require("nodegit");

function random (low, high) {
    return Math.random() * (high - low) + low;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

/////////////////////////////////////////////////////////////////////////////////

// CONFIGURATION

console.log(process.argv);

const libext = process.platform == "win32" ? "dll" : "dylib";

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));
const project_path = process.cwd();
const editor_path = __dirname;
const client_path = path.join(editor_path, "client");
console.log("project_path", project_path);
console.log("editor_path", editor_path);
console.log("client_path", client_path);

const projectlib = "project." + libext;

/////////////////////////////////////////////////////////////////////////////////

// BUILD PROJECT

function project_build() {
	let out = process.platform == "win32"
		? execSync('build.bat "'+editor_path+'"') 
		: execSync('sh build.sh "'+editor_path+'"');
	console.log("built project", out.toString());
}

// should we build now?
if (!fs.existsSync(projectlib) || fs.statSync("project.cpp").mtime > fs.statSync(projectlib).mtime) {
	console.warn("project lib is out of date, rebuilding");
	try {
		project_build();
	} catch (e) {
		console.error("ERROR", e.message);
	}
}

/////////////////////////////////////////////////////////////////////////////////

// BUILD REPO GRAPH

exec('node git.js repo_graph /Users/mp/alicenode_inhabitat/project.cpp', () => {

	console.log("\n\n\nRebuilt Repo Graph\n\n\n");

})

//

/////////////////////////////////////////////////////////////////////////////////

// LAUNCH ALICE PROCESS

// start up the alice executable:
let alice = spawn(path.join(__dirname, "alice"), [projectlib], { 
	cwd: project_path
});

//alice.stdout.on("data", function(data) { console.log(data.toString());});
//alice.stderr.on("data", function(data) { console.log(data.toString());});
alice.on("message", function(data) { console.log("msg", data.toString());});
alice.stdout.pipe(process.stdout);
alice.stderr.pipe(process.stderr);


// when it's done, load the new dll back in:
alice.on('exit', function (code) {
	console.log("alice exit code", code);
	// let node exit when it can:
	//process.exitCode = 1; wasn't working on Windows :-(
	process.exit();
});

function alice_command(command, arg) {
	let msg = command + "?" + arg + "\0";
	console.log("sending alice", msg);
	alice.stdin.write(command + "?" + arg + "\0");
}

/*
setInterval(function() {
	unloadsim();
	loadsim();
}, 3000);
*/

// MMAP THE STATE

let statebuf 
try {
	statebuf = mmapfile.openSync("state.bin", fs.statSync("state.bin").size, "r+");
	console.log("mapped state.bin, size "+statebuf.byteLength);
		
	// slow version:
	setInterval(function() {
		let idx = randomInt(0, 10) * 8;
		let v = statebuf.readFloatLE(idx);
		v = v + 0.01;
		if (v > 1.) v -= 2.;
		if (v < -1.) v += 2.;
		statebuf.writeFloatLE(v, idx);
	}, 1000/120);
} catch(e) {
	console.error("failed to map the state.bin:", e.message);
}


/////////////////////////////////////////////////////////////////////////////////

// HTTP SERVER

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
    res.sendFile(path.join(client_path, 'index.html'));
});
//app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app);

// add a websocket service to the http server:
const wss = new WebSocket.Server({ server });

// send a (string) message to all connected clients:
function send_all_clients(msg) {
	wss.clients.forEach(function each(client) {
       client.send(msg);
    });
}

// whenever a client connects to this websocket:
wss.on('connection', function(ws, req) {
	
	console.log("server received a connection");
	console.log("server has "+wss.clients.size+" connected clients");
	
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
	// respond to any messages from the client:
	ws.on('message', function(message) {

		//git stuff:
		if (message.includes("git show")) {

			//var show = message.replace("Commit_Hash", "git show")
			var gitCommand = (message + ":" + "project.cpp");

			//path.join("..", "alicenode_inhabitat/project.cpp")
				exec(gitCommand, { cwd: path.join("..", "alicenode_inhabitat" )}, (err, stdout) => {
					//console.log(err);
					//console.log(stdout);
					ws.send("edit? " + stdout)

			});

			
			//console.log(gitCommand);
		}

		if (message.includes("git return to master")){

			 exec("git show master:" + path.join("..", "alicenode_inhabitat/project.cpp"), (stderr, err, stdout) => {
			 ws.send("edit? " + err)

            })
		}

		let q = message.indexOf("?");
		if (q > 0) {
			let cmd = message.substring(0, q);
			let arg = message.substring(q+1);
			switch(cmd) {
			case "edit": 
				console.log(arg);
				fs.writeFileSync("project.cpp", arg, "utf8");
				break;

			default:
				console.log("unknown cmd", cmd, "arg", arg);
			}
		} else {
			console.log("message", message, typeof message);
		}
	});
	
	ws.on('error', function (e) {


		if (e.message === "read ECONNRESET") {
			// ignore this, client will still emit close event
		} else {
			console.error("websocket error: ", e.message);
		}
	});

	// what to do if client disconnects?
	ws.on('close', function(connection) {
		console.log("client connection closed");

		// tell git-in-vr to push the atomic commits?
	});
	
	// send a handshake?
	ws.send("state?"+fs.readFileSync("state.h", "utf8"));
	if (statebuf) ws.send(statebuf);
	ws.send("edit?"+fs.readFileSync("project.cpp", "utf8"));

});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

setInterval(function() {
	if (statebuf) send_all_clients(statebuf);
	//send_all_clients("fps?"+);
}, 100);

/////////////////////////////////////////////////////////////////////////////////

// SIM LOADER

function loadsim() {
	// TODO: find a better way to IPC commands:
	alice_command("openlib", projectlib);
	
}

function unloadsim() {
	// TODO: find a better way to IPC commands:
	alice_command("closelib", projectlib);
}

//loadsim();

/////////////////////////////////////////////////////////////////////////////////

// EDIT WATCHER

// would be better to be able to use a dependency tracer,
// so that any file that sim.cpp depends on also triggers.

let watcher = chokidar.watch(project_path, {ignored: project_path+"/.git" } );

watcher

.on('error', error => console.log(`Watcher error: ${error}`))
.on('change', (filepath, stats) => {
	switch (path.extname(filepath)) {
		case ".cpp":
		{
		execSync('git add .', {cwd: path.join("..", "alicenode_inhabitat")}, () => {console.log("git added")})
		execSync('git commit -m "client updated project"', {cwd: path.join("..", "alicenode_inhabitat")}, () => {console.log("git committed")})
		//create digraph from git history of project.cpp
		execSync('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=project.cpp' + ' > ' + path.join("..", "alicenode/repo_graph.dot"), {cwd: "/Users/mp/alicenode_inhabitat"}, () => {console.log("made the repo_graph.dot")});
		//convert the digraph to svg
		execSync('dot -Tsvg ' + path.join("..", "alicenode/repo_graph.dot") + ' -o ' + path.join("..", "alicenode/client/repo_graph.svg"), () => {console.log("made repo_graph.svg")});

		//exec('git rev-list --all --parents --timestamp -- test/sim.cpp > times.txt')

		unloadsim();
			
		send_all_clients("edit?"+fs.readFileSync("project.cpp", "utf8"));
}
		break;

		case "*.h":
		{	//execPromise('git commit add .', {cwd: project_path})
			//	.then(function (result){
			//		exec(`git commit -m "client updated ${filepath}"`, {cwd: project_path})
			//		console.log(`File ${filepath} has been changed and committed`);
				
				
		
				// first have to unload the current sim, to release the lock on the dll:
				unloadsim();
			
				send_all_clients("edit?"+fs.readFileSync("project.cpp", "utf8"));
			}
			//)



			try {
				project_build();
				loadsim();
			//	exec('node git.js repo_graph ' + path.join("..", "alicenode_inhabitat"), {cwd: path.join("..", "alicenode_inhabitat")}, () => {
						//ws.send("updateRepo");

			//	});

			} catch (e) {
				console.error(e.message);
			}
		 break;
		case ".glsl": {
			exec(`git commit -a -m "client updated ${filepath}" ${filepath}`);
			console.log(`File ${filepath} has been changed and committed`);
			alice_command("reloadgpu", "");

			try {
				exec('node git.js repo_graph ' + project_path, () => {
						ws.send("updateRepo");

				});			
			}

			catch (e) {
				console.error(e.message);
			}

		} break;
		default: {		
			console.log(`File ${filepath} has been changed`);
		}
	}
});
