#!/usr/bin/env node

const { exec, spawn, fork } = require('child_process');

const nodemon = require('nodemon');
const app = "server.js";
var terminate = require('terminate');
const os = require("os");
const find = require('find-process');

nodemon({ script: app });
nodemon.on('start', function () {
	console.log(app + ' has started');
}).on('quit', function () {
	console.log(app + ' has quit');
	process.exit();
}).on('restart', function (files) {
	console.log("----------------------------------------------------------------------");
	console.log(app + ' restarted due to: ', files);
}).on('crash', function() {



//on crash, determine os.type, then kill all alice processes before restarting
	switch (os.type) {

		case "Darwin":
		
		find('name', 'alice')
			.then(function (list) {
	
			let pidList = list.map(a => a.pid)
	
				pidList.forEach(function(element) {
	
					terminate(element, function (err) {
						if (err) { // you will get an error if you did not supply a valid process.pid 
							console.log("pidTerminate: " + err); // handle errors in your preferred way. 
						}
						else {
							console.log('done'); // terminating the Processes succeeded. 
						}
					});
	
				})
	
			  });
		  break;
		
		case "Windows_NT":
	
		find('name', 'alice.exe')
			.then(function (list) {
	
				  let pidList = list.map(a => a.pid)
	
				  pidList.forEach(function(element) {
	
					terminate(element, function (err) {
						if (err) { // you will get an error if you did not supply a valid process.pid 
							console.log("pidTerminate: " + err); // handle errors in your preferred way. 
						}
						else {
							console.log('done'); // terminating the Processes succeeded. 
						}
					});
	
				  })
	
			});
			break;
	
	}



	nodemon.restart();
	nodemon({
		script: app
	});
});