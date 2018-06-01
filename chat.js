// var express = require('express');
// var app = express();
// var server = require('http').createServer(app);
// var io = require('socket.io')(server);

// app.get('/', function(req, res, next) {
//     res.sendFile(__dirname + '/client/chat.html')
// });

// app.use(express.static('public'));


// io.on('connection', function(client) {
//     console.log('Client connected...');

//     client.on('join', function(data) {
//         console.log(data);
//     });
// });

// server.listen(7777);



// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// app.get('/', function(req, res){
//     res.sendFile(__dirname + '/client/chat.html');
// });

// io.on('connection', function(socket){
//   console.log('a user connected');
//   socket.on('disconnect', function(){
//     console.log('user disconnected');
//   });
//   socket.on('chat message', function(msg){
//     console.log('message: ' + msg);
//     io.emit('chat message', msg);

//   });
// });



// http.listen(3001, function(){
//     console.log('listening on *:3001');
//   });

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/chat.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
      console.log(msg)
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});