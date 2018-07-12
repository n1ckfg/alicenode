// simple script which runs when launch.sh exits; tells the audiostate_sonification.maxpat to initiate a safe shutdown of max
const WebSocket = require('ws')
var ws = new WebSocket('ws://localhost:8080');

ws.onopen = function () {
  ws.send("closePatcher")
  
};

process.on('exit', function(code) {  
  return console.log(`About to exit with code ${code}`);
});