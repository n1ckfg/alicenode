#!/usr/bin/env node

//const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, spawn, spawnSync, fork } = require('child_process');

function random (low, high) {
    return Math.random() * (high - low) + low;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

/////////////////////////////////////////////////////////////////////////////////

// CONFIGURATION

console.log(process.argv);

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  "../project/");
const project_path = process.cwd();
const editor_path = __dirname;
const client_path = path.join(editor_path, "client");
console.log("project_path", project_path);
console.log("editor_path", editor_path);
console.log("client_path", client_path);

/////////////////////////////////////////////////////////////////////////////////

// LAUNCH ALICE PROCESS

// start up the alice executable:
let alice = spawn(path.join(__dirname, "alice"), [], { 
	cwd: process.cwd()
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



// MMAP THE STATE

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

/////////////////////////////////////////////////////////////////////////////////

// HTTP SERVER

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
    res.sendFile(path.join(client_path, 'index.html'));
});
app.get('*', function(req, res) {
    console.log(req);
});
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
		let q = message.indexOf("?");
		if (q > 0) {
			let cmd = message.substring(0, q);
			let arg = message.substring(q+1);
			switch(cmd) {
			case "edit": 
				//console.log(arg);
				//fs.writeFileSync("sim.cpp", arg, "utf8");
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
	//ws.send("state?"+state_h);
	//ws.send(statebuf);
	//ws.send("edit?"+fs.readFileSync("sim.cpp", "utf8"));
	
});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

/////////////////////////////////////////////////////////////////////////////////

// SIM LOADER

function loadsim() {
	// TODO: find a better way to IPC commands:
}

function unloadsim() {
	// TODO: find a better way to IPC commands:
}

loadsim();

/////////////////////////////////////////////////////////////////////////////////

// EDIT WATCHER

// would be better to be able to use a dependency tracer,
// so that any file that sim.cpp depends on also triggers.
fs.watch(path.join(project_path,'project.cpp'), (ev, filename) => {
	if (ev == "change") {
		console.log(ev, filename);
		if (sim) {
			// first have to unload the current sim, to release the lock on the dll:
			unloadsim();
			
			send_all_clients("edit?"+fs.readFileSync("sim.cpp", "utf8"));

			// next call out to a script to rebuild it:
			let make = process.platform == "win32"
				? spawn("build.bat", [editor_path]) 
				: spawn("sh", ["build.sh", editor_path]);
			//make.stdout.on("data", function(data) { console.log(data.toString());});
			//make.stderr.on("data", function(data) { console.log(data.toString());});
			make.stdout.pipe(process.stdout);
			make.stderr.pipe(process.stderr);
			// when it's done, load the new dll back in:
			make.on('exit', function (code) {
				console.log("built sim exit code", code);
				loadsim();
			});
		}
	}
});