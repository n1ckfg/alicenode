const WebSocket = require('ws')

const wss = new WebSocket.Server({ port:9090 })

wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    // console.log(typeof message)
    let msg = JSON.parse(message)
    console.log(msg.cmd)
    switch(msg.cmd){

      case 'fileSave':
        console.log('snared')
        wss.clients.forEach((client) => {
          client.send(message)
        });
      break

      default: console.log(msg)
    }
  })

  // todo: get list of connected Pis!, pass back to webclient
})

var express = require('express')
var app = express()
const path = require('path')

var htmlPath = path.join(__dirname);

app.use(express.static(htmlPath));
app.use(express.static('node_modules/codemirror'));

var server = app.listen(3000, function () {
    var host = 'localhost';
    var port = server.address().port;
    console.log('listening on http://'+host+':'+port+'/');
});