#!/usr/bin/env node

const nodemon = require("nodemon");
const app = "npm install";

const config = {
	ext: "cpp h js",
	//exec: 'npm install && npm start',
	execMap: {
		"js": "npm start",
		"cpp h": 'npm install && npm start',
	}
}

nodemon(config);

nodemon.on('start', function () {
	console.log(app + ' has started');
}).on('quit', function () {
	console.log(app + ' has quit');
	process.exit();
}).on('restart', function (files) {
	console.log(app + ' restarted due to: ', files);
}).on('crash', function() {
	nodemon.restart();
	nodemon(config);
});

