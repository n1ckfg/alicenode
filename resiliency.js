#!/usr/bin/env node


// this script ensures other scripts/processes are running, and relaunch if they fail

const fs = require('fs')

// const fastcall = require("fastcall")
const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const path = require('path')
const os = require('os')
const { exec, execSync, spawn, spawnSync, fork } = require('child_process')
const sendmail = require('sendmail')();
const ps = require('ps-node'); // check if a process is running. using it in the function that checks and/or launches the max/msp sonification patch
//const shutdown = require('electron-shutdown-command');

exec("node webterminal.js", (stdout, stderr, err) => {
  console.log(stdout,stderr,err)
})
/// ///////////////////////////////////////////////////////////////////////////

// CONFIGURATION

const libext = process.platform === 'win32' ? 'dll' : 'dylib'

// derive project to launch from first argument:
process.chdir(process.argv[2] || path.join('..', 'alicenode_inhabitat'))
const projectPath = process.cwd()
const serverPath = __dirname
const clientPath = path.join(serverPath, 'client')

const projectlib = 'project.' + libext


 
var crashCountAlice = 0;
var crashCountMax = 0;
setInterval(function () {

  // is Alice running?
  ps.lookup({
    command: 'Alice',
    }, function(err, resultList ) {
    if (err) {
        throw new Error( err );
    }
    //console.log(resultList)
    if (resultList.length == 0) {
      console.log("alice not running, launching now")
      crashCountAlice++;
      if (crashCountAlice < 4) {
        console.log("alice has crashed " + crashCountAlice + " times")

        switch (libext) {
          case "dylib":
            exec("../alicenode/alice project.dylib")
          break;

          case "win32":
          case "dll":
          console.log("launch windows")
            exec("../alicenode/alice.exe project.dll", {cwd: projectPath})

          break;
        }
      } else {
        switch (libext) {
          case "dylib":
          console.log("alice has crashed more than 3 times, restarting machine!")

          break;

          case "win32":
          case "dll":
          console.log("alice has crashed more than 3 times, restarting machine!")
          ws.send("closePatcher")
          //shutdown.shutdown(); // simple system shutdown with default options

          
         // execSync("shutdown /r -t 5")
          break;
        }
      }
    } else {
        resultList.forEach(function( process ){
          if ( process ){

            //report Alice running:
            console.log( 'Process check: Application %s running on PID: %s', process.command, process.pid);

          } 
      }); 
    }
  })

  // is Max running?
  ps.lookup({
    command: 'Max',
    }, function(err, resultList ) {
    if (err) {
        throw new Error( err );
    }
    //console.log(resultList)
    if (resultList.length == 0) {
      console.log("max not running, launching now")
      crashCountMax++;
      console.log("max has crashed " + crashCountMax + " times")


      switch (libext) {
        case "dylib":
        exec("open -a Max " + projectPath + "/audio/audiostate_sonification.maxpat")

        break;

        case "win32":
        case "dll":
        exec("start " + projectPath + "/audio/audiostate_sonification.maxpat")

        break;
      }
    } else {
        resultList.forEach(function( process ){
          if ( process ){
            //report max running:
            console.log('Process check: Application %s running on PID: %s', process.command, process.pid);

          } 
      }); 
    }
  })



}, 10000)

// to do:
// if the simulation goes down, relaunch it

// if the simulation goes down 3 times in a row, restart the computer



// HTTP SERVER

let sessionId = 0
let sessions = []

const app = express()
app.use(express.static(clientPath))
app.get('/', function (req, res) {
  res.sendFile(path.join(clientPath, 'index.html'))
})
// app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app)

// add a websocket service to the http server:
const wss = new WebSocket.Server({ server })

// send a (string) message to all connected clients:
function sendAllClients (msg) {
  wss.clients.forEach(function each (client) {
    client.send(msg)
  })
}

// whenever a client connects to this websocket:
wss.on('connection', function (ws, req) {
  let perSessionData = {
    id: sessionId++,
    socket: ws

  }
  let fileName // user-selected fileName
  let userName; 


  

  sessions[perSessionData.id] = perSessionData

  console.log('server received a connection, new session ' + perSessionData.id)
  console.log('server has ' + wss.clients.size + ' connected clients')
// function writeReport() {
//   fs.writeFileSync(serverPath + "/aliceReport.json", JSON.stringify(aliceReport, null, 2),  'utf-8')
// }

// let aliceReport = JSON.parse(fs.readFileSync(serverPath + "/aliceReport.json"));
// console.log(aliceReport)
// ufxErrors = aliceReport[0].ufxErrors;
// console.log(ufxErrors)

// let audioSpikes = 0;
// on message receive
  ws.on('message', function (message) {

      // process WebSocket message
    if (message.includes("relay")){
      relayMessage = message.slice(6)
        switch (message) {

          case "kinect":
          break
        }

    }
    console.log(message)
  switch (message) {

    case "audio spiking":
    console.log("persistent audio spiking within 5 second window, restarting Max")
    ws.send("closePatcher")

      break
    case "MaxMSP: RME UFX+ Driver NOT Loaded":
   // ufxErrors++;
    ws.send("closePatcher")
    // aliceReport.push({ufxErrors: ufxErrors})
    // writeReport();
   
    //disable this for now: (i don't want a thousand emails today)
    //sendemail();

      break
    case "test":
      console.log("writing test report value")
      // aliceReport.push({testData: "test"})
      // writeReport();

      break


  }
  

})

  ws.on('error', function (e) {
    if (e.message === 'read ECONNRESET') {
      // ignore this, client will still emit close event
    } else {
      console.error('websocket error: ', e.message)
    }
  })

  // what to do if client disconnects?
  ws.on('close', function (connection) {
    console.log('client connection closed')

    delete sessions[perSessionData.id]

    // tell git-in-vr to push the atomic commits?
  })
})

server.listen(8080, function () {
  console.log('server listening on %d', server.address().port)
})

function sendemail () {
  sendmail({
    from: 'alicenodeerrors@gmail.com',
    to: 'info@palumbomichael.com ',
    subject: 'Alicenode Error: RME UFX+ Not Loaded',
    html: 'hello from Korea ',
  }, function(err, reply) {
    console.log(err && err.stack);
    console.dir(reply);
  });

}