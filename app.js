var http = require("http"),
terminal = require("web-terminal");

//   var editor = CodeMirror.fromTextArea(myTextarea, {
//     lineNumbers: true
//   });

// app.js
var WebSocketServer = require('websocket').server;
var express         = require('express');
var app             = express();
var server          = app.listen(8888);
var wsServer        = new WebSocketServer({ httpServer : server });

// this will make Express serve your static files


app.use(express.static(__dirname));
var app = http.createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World\n");
});

app.listen(1337);
console.log("Server running at http://127.0.0.1:1337/");

terminal(app);
console.log("Web-terminal accessible at http://127.0.0.1:1337/terminal");