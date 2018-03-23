/*

What this script does:

- loads the alice service (dll or exe?) and obtains an FFI
	- triggers a setup event (which is what main() would do in alice.exe)
	- triggers frame events on alice (couldn't this be managed within alice.exe?)
	- LATER: send more sporadic messages (maybe via stdio, pipe, etc. instead)
- loads the app as dll 
	- obtains FFI for onload/onunload
	- watches for changes to the app source code and unloads/recompiles/loads accordingly
	- using bat/sh/node scripts? to recompile
	- triggering onload/onunload within the app dll
- also obtains an mmap buffer to directly modify the app state struct
	- proves that it can do so
- creates an http server that serves content in /client
	- adds a websocket to it for continuous communication with browser
	- including sending the app's state struct header, state buffer, source code...
	- TODO: pipe stdout/err to browser too; launching as alice.exe would make that easier. 
	
- TODO: restart alice/this script on errors... e.g. launch via nodemon

In short:

1. load the main services & get them started
2. load the app dll and hot reload as needed
3. expose a web interface onto the app state (mmap) & source (recompile)

Node/webclient is thus acting a bit like a debugger. 

*/
const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, spawn, fork } = require('child_process');



function random (low, high) {
    return Math.random() * (high - low) + low;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

const libext = process.platform == "win32" ? "dll" : "dylib";

const client_path = path.join(__dirname, "client");



let state_h = fs.readFileSync("state.h", "utf8");

// report status:
process.on("exit", function(m) { console.log("server closing"); });

function getTime() {
	let hrt = process.hrtime();
	return hrt[0] + hrt[1]*1e-9;
}
let t = getTime();
let framecount = 0;
let fpsAvg = 0;

let statebuf;

// create an HTTP server
// using express to serve html files easily
const app = express();
//app.use(function (req, res) { res.send({ msg: "hello" }); });
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
		

		if (message.includes("Commit_Hash")) {

			var show = message.replace("Commit_Hash", "git show")
			var gitCommand = (show + ":test/sim.cpp")

				exec(gitCommand, (err, stdout) => {
				//	console.log(err);
				//	console.log(stdout);
					ws.send("edit? " + stdout)

			});

			
			//console.log(gitCommand);
		} 

		if (message.includes("git return to master")){

			 exec("git show master:test/sim.cpp", (stderr, err, stdout) => {
			 ws.send("edit? " + err)

            })
		}

		else {



		let q = message.indexOf("?");
		if (q > 0) {
			let cmd = message.substring(0, q);
			let arg = message.substring(q+1);
			switch(cmd) {
			case "edit": 
				//console.log(arg);
				fs.writeFileSync("sim.cpp", arg, "utf8");
				break;
			default:
				console.log("unknown cmd", cmd, "arg", arg);
			}
		} 


		else {
			console.log("message", message, typeof message);
		}
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
	ws.send("state?"+state_h);
	ws.send(statebuf);
	ws.send("edit?"+fs.readFileSync("sim.cpp", "utf8"));

});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

process.stdout.on('data', function() {
	console.log("-");
});

//git stuff:

var repo_folder = __dirname.substring(0, __dirname.lastIndexOf('/'));
console.log("this is it: " + repo_folder)

let rf = fork('repo_graph.js', [repo_folder + "/test"], { stdio:"inherit"});
//rf.stdout.pipe(process.stdout);
//rf.stderr.pipe(process.stderr);

/*
fs.watch('repo_graph.svg', (ev, filename) => {
	if (ev == "change") {
		console.log(ev, filename);
	}
})



*/

///


const renderer = new fastcall.Library("alice."+libext);
renderer.declare(`
int setup();
int frame();
`);
res = renderer.interface.setup();
console.log(res);

function onframe() {

	bufchange();

    let res = renderer.interface.frame()
    let t1 = getTime();
    let dt = t1-t;
    t = t1;
    framecount++;
    fpsAvg += 0.1*(1./dt - fpsAvg);
    
    send_all_clients("fps?" + Math.floor(fpsAvg));
    send_all_clients(statebuf);
    
    //send_all_clients(res);
    
    return res;  // 0 means close the window
}

// fast version:
function onframeFast() {
    if (onframe())
        setImmediate(onframeFast);
}
//onframeFast();

// slow version:
setInterval(onframe, 1000/120);

let sim;
function unloadsim() {
	if (sim && sim.interface) {
		// null the global sim variable to prevent double-unloading
		const lib = sim;
		sim = null;
		console.log("sim unloading");
		lib.interface.onunload();
		lib.release();
		console.log("sim released");
	}
}
function loadsim() {
	let lib = new fastcall.Library("sim."+libext);
	lib.declare(`
	int onload();
	int onunload();
	`);
	console.log(lib.interface.onload());
	// make it public
	sim = lib;
}
loadsim();



statebuf = mmapfile.openSync("state.bin", fs.statSync("state.bin").size, "r+");
console.log("mapped state.bin, size "+statebuf.byteLength);


function bufchange() {
	let idx = randomInt(0, 10) * 8;
	let v = statebuf.readFloatLE(idx);
	v = v + 0.1;
	if (v > 1.) v -= 2.;
	statebuf.writeFloatLE(v, idx);
}

// would be better to be able to use a dependency tracer,
// so that any file that sim.cpp depends on also triggers.
fs.watch('sim.cpp', (ev, filename) => {
	if (ev == "change") {
		console.log(ev, filename);
		if (sim) {
			// first have to unload the current sim, to release the lock on the dll:
			{
				// null the global sim variable to prevent double-unloading
				const lib = sim;
				sim = null;
				console.log("sim unloading");
				lib.interface.onunload();
				lib.release();
				console.log("sim released");
			}
			
			send_all_clients("edit?"+fs.readFileSync("sim.cpp", "utf8"));

			// next call out to a script to rebuild it:
			let make = process.platform == "win32"
				? spawn("make_sim.bat", ["sim.cpp"]) 
				: spawn("sh", ["make_sim.sh", "sim.cpp"]);
			//make.stdout.on("data", function(data) { console.log(data.toString());});
			//make.stderr.on("data", function(data) { console.log(data.toString());});
			make.stdout.pipe(process.stdout);
			make.stderr.pipe(process.stderr);
			// when it's done, load the new dll back in:
			make.on('exit', function (code) {
				console.log("built sim exit code", code);
				loadsim();
			});
			
			//add/commit the new sim.cpp
			gitAdd = exec('git add test/sim.cpp');

			/*
				.then(spawn('git commit -m \"change to sim.cpp\"'))
				//update the repo_graph.svg
					.then(spawn('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=test/sim.cpp' + process.argv[2] + ' > /Users/mp/alicenode/test/repo_graph.dot'))
						.then(spawn('dot -Tsvg repo_graph.dot -o client/repo_graph.svg'))
							.then(exec('git status', (err, stdout, stderr) => {

							console.log(stdout)

							//tell all_clients to reload the svg
							}))   */
		}
	}
});

/*
// nodemon is doing this already
fs.watchFile('index.js', (curr, prev) => {
	console.log(`the current mtime is: ${curr.mtime}`);
	console.log(`the previous mtime was: ${prev.mtime}`);

	if (curr.mtime > prev.mtime) {
		process.exit();
	}
});*/

//setInterval(loadsim, 3000)

console.log("okay");