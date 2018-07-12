#!/usr/bin/env node


// this script ensures other scripts/processes are running, and relaunch if they fail


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
const ps = require('ps-node'); // check if a process is running. using it in the function that checks and/or launches the max/msp sonification patch



function random (low, high) {
  return Math.random() * (high - low) + low
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

/// ///////////////////////////////////////////////////////////////////////////

// CONFIGURATION

const libext = process.platform === 'win32' ? 'dll' : 'dylib'

// derive project to launch from first argument:
process.chdir(process.argv[2] || path.join('..', 'alicenode_inhabitat'))
const projectPath = process.cwd()
const serverPath = __dirname
const clientPath = path.join(serverPath, 'client')

const projectlib = 'project.' + libext



// listen to max.app for performance issues:

var ws = new WebSocket('ws://localhost:8080');

ws.onopen = function () {
  
};

//the sonification patch runs some profiling and will send messages to resiliency.js if any of the measures go over a threshold:
ws.on('message', function (message) {
  //console.log(message)
  switch (message) {
    
    case "audio spiking":
    console.log("persistent audio spiking within 5 second window, restarting Max")
    ws.send("closePatcher")
    break;
  }
});

// // remove temporary files:
// removeTempFiles()
// function removeTempFiles () {
//   cardsFileList = fs.readdirSync(serverPath + '/cpp2json/output').filter(function (file) {
//       if (file.includes('.json')) {
//         fs.unlink(serverPath + '/cpp2json/output/' + file, (err) => {
//           if (err) throw err;
//           console.log('/cpp2json/output/' + file + ' was deleted');
//         });
//       }
//     else {
//       return file
//     }
//   })
// }
// refresh the state from the mmap every 10 seconds
//let maxPID; // the process ID for max/msp
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
      console.log("alice has crashed " + crashCountAlice + " times")

      switch (libext) {
        case "dylib":
          exec("../alicenode/alice project.dylib")
        break;

        case "win32":
        case "dll":
          exec("..\alicenode\alice.exe project.dll")

        break;
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



