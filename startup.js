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
const projectPath = process.cwd()
const serverPath = __dirname
const clientPath = path.join(serverPath, 'client')

const projectlib = 'project.' + libext