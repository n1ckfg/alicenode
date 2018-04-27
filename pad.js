const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');
const chokidar = require('chokidar');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const execPromise = require('child-process-promise');
const nodegit = require("nodegit");

//console.log(process.argv);

const libext = process.platform == "win32" ? "dll" : "dylib";

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");


//get the names of current worktrees
		exec("git worktree list --porcelain | grep -e 'worktree' | cut -d ' ' -f 2 | grep -o \"+.*\"", {cwd: project_path}, (stderr, err) => {         
            //send updated list to client
			//send updated list to client
             err = err.split(/\n/g).toString()
             console.log(err)
             console.log(Array.isArray(err))
             console.log(typeof err[1])


			// worktrees = []
			//         err.forEach(function(element) {
			// 		//console.log("test " + element)
			// 		worktrees.push(element)
			// 		})
			// 		console.log(worktrees)
			// ws.send("worktreeList?" + (err.split(/\n/g).filter(String)))

		}) 