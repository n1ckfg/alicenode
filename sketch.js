// #!/usr/bin/env node

// //const fastcall = require("fastcall")
// const express = require('express');
// const WebSocket = require('ws');
// // const mmapfile = require('mmapfile');
// const chokidar = require('chokidar');

// //zlib compression:
// const pako = require('pako');

// const JSON5 = require('json5');
// const http = require('http');
// const url = require('url');
// const fs = require("fs");
// const path = require("path");
// const os = require("os");
// const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
// const execPromise = require('child-process-promise');

// const libext = process.platform == "win32" ? "dll" : "dylib";
// // derive project to launch from first argument:
// process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));

// const project_path = process.cwd();
// const server_path = __dirname;
// const client_path = path.join(server_path, "client");


// console.log(project_path + "/project.cpp")

// let fileList = fs.readdirSync(project_path).filter(function(file) {

//   if(file.charAt(0) == "+");
//   else if(file.charAt(0) == ".");
//   else if(file.includes("userlist.json"));
//   else if(file.includes(".code-workspace"));
//   else if(file.includes("tmp"));
//   //to do add filter that makes sure it ignores folders! maybe in the future we'll want to recursively search folders, but for now, folders likely indicate either git meta, worktrees, or tmp. 
//   else {
//     return file
//   }
// })

// console.log(fileList)

// exec('git log --all --source --abbrev-commit --pretty=oneline ', {cwd: project_path}, (stdout, stderr, err) => {
//   console.log(stderr)
// })
//THIS FILE IS USED AS A SANDBOX FOR TESTING/ADDING NEW IDEAS/CODE

// console.log( path.join(server_path + '/branchList.csv'))
// exec('git branch -v > ' + path.join(server_path + '/branchList.csv'), {cwd: project_path}, (stdout,err,stderr) => {
//     console.log(err.split("\r\n", ""))

// })

// userEntry = JSON.parse(fs.readFileSync(path.join(project_path, "userlist.json"), 'utf8'));

// console.log(userEntry)


// Walker(project_path)
//   .filterDir(function(dir, stat) {
//     if (dir === '/etc/pam.d') {
//       console.warn('Skipping /etc/pam.d and children')
//       return false
//     }
//     return true
//   })
//   .on('entry', function(entry, stat) {
//     console.log('Got entry: ' + entry)
//   })
//   .on('dir', function(dir, stat) {
//     console.log('Got directory: ' + dir)
//   })
//   .on('file', function(file, stat) {
//     console.log('Got file: ' + file)
//   })
//   .on('symlink', function(symlink, stat) {
//     console.log('Got symlink: ' + symlink)
//   })
//   .on('blockDevice', function(blockDevice, stat) {
//     console.log('Got blockDevice: ' + blockDevice)
//   })
//   .on('fifo', function(fifo, stat) {
//     console.log('Got fifo: ' + fifo)
//   })
//   .on('socket', function(socket, stat) {
//     console.log('Got socket: ' + socket)
//   })
//   .on('characterDevice', function(characterDevice, stat) {
//     console.log('Got characterDevice: ' + characterDevice)
//   })
//   .on('error', function(er, entry, stat) {
//     console.log('Got error ' + er + ' on entry ' + entry)
//   })
//   .on('end', function() {
//     console.log('All files traversed.')
//   })

// if (fs.existsSync(path.join(project_path, "userlist.json"))) {

// 	console.log("it exists")
// } else {console.log("it doesn't exist")}



// arg = "Michael"
// exec('git worktree add ' + path.join(project_path, "+" + arg), {cwd: project_path}, (stdout, stderr, err) => {
//   console.log(err, stderr, stdout)
// })

// "use strict";
// // Optional. You will see this name in eg. 'ps' or 'top' command
// process.title = 'node-chat';
// // Port where we'll run the websocket server
// var webSocketsServerPort = 1337;
// // websocket and http servers
// var webSocketServer = require('websocket').server;
// var http = require('http');
// /**
//  * Global variables
//  */
// // latest 100 messages
// var history = [ ];
// // list of currently connected clients (users)
// var clients = [ ];
// /**
//  * Helper function for escaping input strings
//  */
// function htmlEntities(str) {
//   return String(str)
//       .replace(/&/g, '&amp;').replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// }
// // Array with some colors
// var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// // ... in random order
// colors.sort(function(a,b) { return Math.random() > 0.5; } );
// /**
//  * HTTP server
//  */
// var server = http.createServer(function(request, response) {
//   // Not important for us. We're writing WebSocket server,
//   // not HTTP server
// });
// server.listen(webSocketsServerPort, function() {
//   console.log((new Date()) + " Server is listening on port "
//       + webSocketsServerPort);
// });
// /**
//  * WebSocket server
//  */
// var wsServer = new webSocketServer({
//   // WebSocket server is tied to a HTTP server. WebSocket
//   // request is just an enhanced HTTP request. For more info 
//   // http://tools.ietf.org/html/rfc6455#page-6
//   httpServer: server
// });
// // This callback function is called every time someone
// // tries to connect to the WebSocket server
// wsServer.on('request', function(request) {
//   console.log((new Date()) + ' Connection from origin '
//       + request.origin + '.');
//   // accept connection - you should check 'request.origin' to
//   // make sure that client is connecting from your website
//   // (http://en.wikipedia.org/wiki/Same_origin_policy)
//   var connection = request.accept(null, request.origin); 
//   // we need to know client index to remove them on 'close' event
//   var index = clients.push(connection) - 1;
//   var userName = false;
//   var userColor = false;
//   console.log((new Date()) + ' Connection accepted.');
//   // send back chat history
//   if (history.length > 0) {
//     connection.sendUTF(
//         JSON.stringify({ type: 'history', data: history} ));
//   }
//   // user sent some message
//   connection.on('message', function(message) {
//     if (message.type === 'utf8') { // accept only text
//     // first message sent by user is their name
//      if (userName === false) {
//         // remember user name
//         userName = htmlEntities(message.utf8Data);
//         // get random color and send it back to the user
//         userColor = colors.shift();
//         connection.sendUTF(
//             JSON.stringify({ type:'color', data: userColor }));
//         console.log((new Date()) + ' User is known as: ' + userName
//                     + ' with ' + userColor + ' color.');
//       } else { // log and broadcast the message
//         console.log((new Date()) + ' Received Message from '
//                     + userName + ': ' + message.utf8Data);
        
//         // we want to keep history of all sent messages
//         var obj = {
//           time: (new Date()).getTime(),
//           text: htmlEntities(message.utf8Data),
//           author: userName,
//           color: userColor
//         };
//         history.push(obj);
//         history = history.slice(-100);
//         // broadcast message to all connected clients
//         var json = JSON.stringify({ type:'message', data: obj });
//         for (var i=0; i < clients.length; i++) {
//           clients[i].sendUTF(json);
//         }
//       }
//     }
//   });
//   // user disconnected
//   connection.on('close', function(connection) {
//     if (userName !== false && userColor !== false) {
//       console.log((new Date()) + " Peer "
//           + connection.remoteAddress + " disconnected.");
//       // remove user from the list of connected clients
//       clients.splice(index, 1);
//       // push back user's color to be reused by another user
//       colors.push(userColor);
//     }
//   });
// });
// let stderr = "4f8579f refs/heads/MichaelPalumbo jdkdkfjfjdk\n38f8fhs refs/heads/master dave went to the store\nf8d7r4t refs/heads/master hjskfhjfjkh"
// // String.prototype.replaceAll = function(search, replacement) {
// //   //var target = this;
// //   console.log(stderr.replace(new RegExp(search, 'refs/heads'), replacement))
// // };
// // let find = "refs/heads";
// // let re = new RegExp(find, "refs/heads")
// // let str = stderr.replace(re, '');

// // console.log(str)

// // function replaceAll(str, find, replace) {
// //   return str.replace(new RegExp(find, 'g'), replace);
// // }
// // console.log(replaceAll())

// let some_str = stderr.split('refs/heads').join('')

// console.log(some_str)

// let fileName = "project.cpp"
// exec('git log --all --source --abbrev-commit --pretty="%cr | %cn | %B" -- ' + fileName, {cwd: project_path}, (stdout, stderr, err) => {
//   // console.log(JSON.stringify(stderr))
//   let commitList = stderr.split('refs/heads').join('')
//   // ws.send("branchCommits?" + commitList)
//   console.log(commitList)

//   })

//#!/usr/bin/env node
// const fastcall = require("fastcall")
const express = require('express')
const WebSocket = require('ws')
const mmapfile = require('mmapfile')
const chokidar = require('chokidar')
const pako = require('pako') // zlib compression
const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, execSync, spawn, spawnSync, fork } = require('child_process')
const sortJson = require('sort-json-array');
    const options = { ignoreCase: true, reverse: true, depth: 1};
const getType = require('get-type');

function random (low, high) {
  return Math.random() * (high - low) + low
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

/// ///////////////////////////////////////////////////////////////////////////

// CONFIGURATION

const libext = process.platform === 'win32' ? 'dll' : 'dylib'
console.log(libext);