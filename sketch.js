#!/usr/bin/env node

//const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');
const chokidar = require('chokidar');

//zlib compression:
const pako = require('pako');

const JSON5 = require('json5');
const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const execPromise = require('child-process-promise');

const libext = process.platform == "win32" ? "dll" : "dylib";

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");

//THIS FILE IS USED AS A SANDBOX FOR TESTING/ADDING NEW IDEAS/CODE

exec('git branch -v', {cwd: project_path}, (stdout,err,stderr) => {
    console.log(err.replace("* ", ""))

})