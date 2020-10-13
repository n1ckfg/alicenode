const WS = require('ws')
const ReconnectingWebSocket = require('reconnecting-webSocket')
const fs = require('fs')
 
const options = {
    WebSocket: WS, // custom WebSocket constructor
    connectionTimeout: 1000,
    maxRetries: 10,
};

rwsUrl = 'ws://localhost:9090'
const rws = new ReconnectingWebSocket(rwsUrl,[], options);
console.log('connecting')
rws.addEventListener('open', () => {
    console.log('connected')
});

rws.addEventListener('message', (message) => {

    let msg = JSON.parse(message.data)
    console.log(msg.cmd)
    switch(msg.cmd){

      case 'fileSave':
        fs.writeFileSync(msg.filename, msg.contents)        
      break

      default: console.log(msg)
    }
    console.log(msg);
});

rws.addEventListener('error', (error) => {
    console.log(error);
});

// var http = require("http"),
// terminal = require("web-terminal");

// var app = http.createServer(function (req, res) {
//     res.writeHead(200, {"Content-Type": "text/plain"});
//     // res.end("Hello World\n");
// });

// app.listen(1337);
// console.log("Server running at http://127.0.0.1:1337/");

// terminal(app);
// console.log("Web-terminal accessible at http://127.0.0.1:1337/terminal");


// eventually: list all files in folder, push to server and then to web client... 
// fs.readdir(__dirname, function (err, files) {
//     //handling error
//     if (err) {
//         return console.log('Unable to scan directory: ' + err);
//     } 
//     //listing all files using forEach
//     files.forEach(function (file) {
//         // Do whatever you want to do with the file
//         console.log(file); 
//     });
// });