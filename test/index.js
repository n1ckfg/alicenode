const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');

// mmap-io currently broken on Windows
let mmap_open;
if (process.platform == "win32") {
	let mmap = require("node-filemap");
	
	mmap_open = function(path) {
		const stats = fs.statSync(path);
		const fd = fs.openSync(path, 'r+');
		let map = mmap.FileMapping();
		map.createMapping(path, path, stats.size);

		let buf = Buffer.alloc(stats.size)
		map.readInto(
		  0,         // What byte offset to start reading from
		  20,        // How many bytes to read
		  buf);   // A buffer object to read into
		
		
		mmap.map(stats.size, mmap.PROT_WRITE, mmap.MAP_SHARED, fd, 0);
		fs.closeSync(fd);
		console.log(statebuf.byteLength, stats.size);
		mmap.advise(statebuf, mmap.MADV_RANDOM);
		return buf;
	}

} else {
	let mmap = require("mmap-io");

	mmap_open = function(path) {
		const stats = fs.statSync(path);
		const fd = fs.openSync(path, 'r+');
		let buf = mmap.map(stats.size, mmap.PROT_WRITE, mmap.MAP_SHARED, fd, 0);
		fs.closeSync(fd);
		console.log(statebuf.byteLength, stats.size);
		mmap.advise(statebuf, mmap.MADV_RANDOM);
		return buf;
	}
}

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");

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
app.get('/', function(req, res) {
    res.sendFile(path.join(client_path, 'index.html'));
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
		console.log("message", message, typeof message);
		
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
	ws.send("state:"+state_h);
	ws.send(statebuf);
	
});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});



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
    
    send_all_clients("fps: " + Math.floor(fpsAvg));
    return res
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
function loadsim() {
	sim = new fastcall.Library("sim."+libext);
	sim.declare(`
	int onload();
	int onunload();
	`);
	console.log(sim.interface.onload());
}
loadsim();

function bufchange() {}

/*
{
	statebuf = mmap_open("state.bin");
}

function bufchange() {
	let idx = randomInt(0, 100) * 8;
	let v = statebuf.readFloatLE(idx);
	v = v + 0.1;
	if (v > 1.) v -= 2.;
	statebuf.writeFloatLE(v, idx);
}

*/

setInterval(function() {
	if (sim) {
		console.log("reloading");
		sim.interface.onunload();
		sim.release();
		console.log("released");
	}	
	loadsim();
}, 3000)


console.log("ok");