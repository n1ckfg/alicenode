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

		exec('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=project.cpp' + ' > ' + path.join("..", "alicenode/repo_graph.dot"), {cwd: "/Users/mp/alicenode_inhabitat"}, (err, stderr, stdout) => {
			console.log("made the repo_graph.dot")
			//console.log("Stdout " + stderr)

		exec('dot -Tsvg ' + path.join("..", "alicenode/repo_graph.dot") + ' -o ' + path.join("..", "alicenode/client/repo_graph.svg"), () => {console.log("made repo_graph.svg")});


		});
