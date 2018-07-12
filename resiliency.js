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
setInterval(function () {

  ps.lookup({
    command: 'Max',
    }, function(err, resultList ) {
    if (err) {
        throw new Error( err );
    }
    //console.log(resultList)
    if (resultList.length == 0) {
      console.log("max not running, launching now")

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
            console.log( '\nProcess check: Application MaxMSP running on PID: %s, %s', process.pid, process.command);

          } 
      }); 
    }
  })
  //console.log('\nupdating mapped state var in server')
  //getState();
}, 10000)