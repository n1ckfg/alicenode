const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");

const libext = process.platform == "win" ? "dll" : "dylib";

// report status:
process.on("exit", function(m) { console.log("server closing"); });

function getTime() {
	let hrt = process.hrtime();
	return hrt[0] + hrt[1]*1e-9;
}
let t = getTime();
let framecount = 0;
let fpsAvg = 0;

// create an HTTP server
// using express to serve html files easily
const app = express();
//app.use(function (req, res) { res.send({ msg: "hello" }); });
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
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
	
});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

const sim = new fastcall.Library("sim."+libext);
sim.declare(`
int sim(int x);
`);
console.log(sim.interface.sim(9));

const renderer = new fastcall.Library("alice."+libext);
renderer.declare(`
int setup();
int frame();
`);

res = renderer.interface.setup();

console.log(res);

function onframe() {
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

console.log("ok");