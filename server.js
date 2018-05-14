#!/usr/bin/env node

//const fastcall = require("fastcall")
const express = require('express');
const WebSocket = require('ws');
const mmapfile = require('mmapfile');
const chokidar = require('chokidar');

//zlib compression:
const pako = require('pako');

const http = require('http');
const url = require('url');
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const execPromise = require('child-process-promise');
const nodegit = require("nodegit");

function random (low, high) {
    return Math.random() * (high - low) + low;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

/////////////////////////////////////////////////////////////////////////////////
 
// CONFIGURATION

console.log(process.argv);

const libext = process.platform == "win32" ? "dll" : "dylib";

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");
console.log("project_path", project_path);
console.log("server_path", server_path);
console.log("client_path", client_path);

const projectlib = "project." + libext;

let gitHash;
let projectCPPVersion; //when a version of the project.cpp is requested by a client and placed in the right pane, store it here
let clientOrigRightWorktree; //the worktree used by origRight, and specific to the client
let worktreepath = path.join(client_path, "worktreeList.txt");
let worktreeJSON = []; //list of worktrees in project_path

let commitMsg = "client updated project"; //default commit message if nothing given? 

//if alice is already running from a previous crash, then terminate it
var terminate = require('terminate');

const find = require('find-process');

pruneWorktree()
function pruneWorktree() {
	// update the worktree list, if any worktrees had been removed by user, make sure they aren't
	// still tracked by git
	exec("git worktree prune", {cwd: project_path}, () => {
		// delete work tree (if it exists):
		if (fs.existsSync(worktreepath)) {
			fs.unlinkSync(worktreepath);
		}
	})
}






/////////////////////////////////////////////////////////////////////////////////

// BUILD PROJECT
function project_build() {
	let out = "";
	if (process.platform == "win32") {
		out = execSync('build.bat "'+server_path+'"', { stdio:'inherit'});
	} else {
		out = execSync('sh build.sh "'+server_path+'"', { stdio:'inherit'});
	}
	console.log("built project", out.toString());
}

//GRAHAM: can we please add a startup flag to npm start to disable this as an option? it should be default, but we can't work if we're working on the subway or somewhere else without wifi
// try to pull, as good practice:
//console.log("git pull:", execSync('git pull').toString());

// should we build now?
if (!fs.existsSync(projectlib) || fs.statSync("project.cpp").mtime > fs.statSync(projectlib).mtime) {
	console.warn("project lib is out of date, rebuilding");
	try {
		project_build();
	} catch (e) {
		console.error("ERROR", e.message);
		//do a git commit with a note about it being a failed build. 
	}
}

/////////////////////////////////////////////////////////////////////////////////



// UPDATE GIT REPO: do we commit the alicenode_inhabitat repo on startup?

function git_add_and_commit() {
	try {
				
		execSync('git add .', {cwd: project_path }, () => {console.log("git added")});
		execSync('git commit -m \"' + commitMsg + '\"', {cwd: project_path }, () => {console.log("git committed")});
		execSync('git status', {cwd: project_path }, (stdout) => {console.log("\n\n\n\n\n\n\n" + stdout)});

		// execSync("git log --pretty=format:'{%n “%H”: \"%aN <%aE>\", \"%ad\", \"%f\"%n},' $@ | perl -pe 'BEGIN{print \"[\"}; END{print \"]\n\"}' | perl -pe \'s/},]/}]/\' > " + path.join(client_path, "gitlog.json"), {cwd: server_path}, () => {
		// 	console.log("updated ../client/gitlog.json")
		// })

		//send_all_clients("updateRepo?");

		//exec('git rev-list --all --parents --timestamp -- test/sim.cpp > times.txt')
	} catch (e) {
		console.error(e.toString());
	}
}

//

/////////////////////////////////////////////////////////////////////////////////

// LAUNCH ALICE PROCESS

// start up the alice executable:
let alice = spawn(path.join(__dirname, "alice"), [projectlib], { 
	cwd: project_path
});

//alice.stdout.on("data", function(data) { console.log(data.toString());});
//alice.stderr.on("data", function(data) { console.log(data.toString());});
alice.on("message", function(data) { console.log("msg", data.toString());});
alice.stdout.pipe(process.stdout);
alice.stderr.pipe(process.stderr);


// when it's done, load the new dll back in:
alice.on('exit', function (code) {
	console.log("alice exit code", code);
	// let node exit when it can:
	process.exitCode = 1; //wasn't working on Windows :-(
	process.exit(code);
});

function alice_command(command, arg) {
	let msg = command + "?" + arg + "\0";
	console.log("sending alice", msg);
	alice.stdin.write(command + "?" + arg + "\0");
}

/*
setInterval(function() {
	unloadsim();
	loadsim();
}, 3000);
*/

// MMAP THE STATE

let statebuf 
try {
	statebuf = mmapfile.openSync("state.bin", fs.statSync("state.bin").size, "r+");
	console.log("mapped state.bin, size "+statebuf.byteLength);
		
	// slow version:
	setInterval(function() {
		let idx = randomInt(0, 10) * (4*3);
		let v = statebuf.readFloatLE(idx);
		v = v + 0.01;
		if (v > 1.) v -= 2.;
		if (v < -1.) v += 2.;
		//statebuf.writeFloatLE(v, idx);
	}, 1000/120);
} catch(e) {
	console.error("failed to map the state.bin:", e.message);
}


/////////////////////////////////////////////////////////////////////////////////

// HTTP SERVER

let sessionId = 0;
let sessions = [];

const app = express();
app.use(express.static(client_path))
app.get('/', function(req, res) {
	res.sendFile(path.join(client_path, 'index.html'));

});
//app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app);

// add a websocket service to the http server:
const wss = new WebSocket.Server({ server });

// send a (string) message to all connected clients:
function send_all_clients(msg) {
	wss.clients.forEach(function each(client) {
       client.send(msg);
    });
}


// whenever a client connects to this websocket:
wss.on('connection', function(ws, req) {
	
	let per_session_data = {
		id: sessionId++,
		socket: ws,


	};


		// send a handshake?
		// ws.send("state?"+fs.readFileSync("state.h", "utf8"));
		// if (statebuf) ws.send(statebuf);
		
		ws.send("currentVersion?"+fs.readFileSync("project.cpp", "utf8"));

		
		// //get the names of current worktrees
		// exec("git worktree list --porcelain | grep -e 'worktree' | cut -d ' ' -f 2 | grep -o \"+.*\"", {cwd: project_path}, (stderr, err) => {  
		
		// 	//send updated list to client
		// 	err = err.split(/\n/g).filter(String)
		// 	// worktrees = [];
		// 	        // err.forEach(function(element) {
		// 			// console.log("test " + element)
		// 			// worktrees.push(element)
		// 			// })
		// 			//console.log(element)
		// 			// console.log(Array.isArray(err))
		// 			// console.log(typeof err[1])
		// 	ws.send("worktreeList?" + JSON.stringify(err))

		// }) 


	sessions[per_session_data.id] = per_session_data;

	console.log("server received a connection, new session " + per_session_data.id);
	console.log("server has "+wss.clients.size+" connected clients");
	
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
	// respond to any messages from the client:
	ws.on('message', function(message) {

		
		//create and set worktree
		if (message.includes("addWorktree")){
			newWorkTree = message.replace("addWorktree ", "+")
			console.log(newWorkTree)
			exec("git worktree add --no-checkout " + message.replace("addWorktree ", "+"), (stdout, err, stderr) => {

				getWorktreeList();
				

		
			});
		}

		if (message.includes("switchWorktree")){
			//console.log("worktree is " + arg)
			clientOrigRightWorktree = message.replace("switchWorktree ", "")
			exec("cd " + clientOrigRightWorktree) 
			console.log("Right editor working within " + clientOrigRightWorktree + "'s worktree")
		}

		if (message.includes("getCurrentBranch")){
			exec("git rev-parse --abbrev-ref HEAD", { cwd: project_path }, (stdout, stderr, err) => {
				//console.log("this it sshshs kjdlfj;ldkslfj" + stderr.replace(" string", ""));
				ws.send("branchname?" + stderr.replace("\n", ""))
				//console.log("branchname?" + stderr.replace("\n", ""))
				})
		}
		

		if (message.includes("createNewBranch ")){
					
			//get number of branches in alicenode_inhabitat

			exec("git branch | wc -l", (stdout, stderr, err) => {

		 		onHash = message.replace("createNewBranch ", "")
		 		numBranches = Number(stderr.replace(/\s+/g,''));

		 		// +1 to branch count, name the branch
		 		//if (numBranches > 0) {
				//	 numBranches = (Number(numBranches) + 1)
					 

		 		//	newBranchName = (numBranches + "_" + clientOrigRightWorktree)
				
				exec("git checkout -b " + ((Number(numBranches) + 1) + "_" + clientOrigRightWorktree) + onHash, {cwd: path.join(project_path, clientOrigRightWorktree)}, (stdout) => {
					
					ws.send("Switched to branch " + ((Number(numBranches) + 1) + "_" + clientOrigRightWorktree) + " starting from commit " + onHash)

				})

			})
		}
			
					//create a new branch under a new worktree. worktree saved at ../alicenode_inhabitat/<onHash>
		// 			exec("git worktree add --checkout -b " + newBranchName + " " + onHash , (stdout, stderr, err) => {
						
		// 				//change to new worktree directory	
		// 				exec("cd " + (message.replace("createNewBranch ", "")), () => {

		// 				//	console.log(projectCPPVersion)
		// 					fs.writeFileSync(message.replace("createNewBranch ", "") + "/project.cpp", projectCPPVersion, "utf8");

		// 					//inform client
		// 					ws.send("Switched to branch " + newBranchName + " starting from commit " + onHash)
		
		// 					})
		// 			})
					

		// 		}
		// 		else {
		// 			//if numBranches = 1
		// 			newBranchName = ("playBranch_1 ")
					
		// 			execSync("git worktree add --checkout -b " + newBranchName + " " + onHash, (stdout, stderr, err) => {
		// 			})
		// 			//change to new worktree directory	
		// 			execSync("cd " + onHash, () => {

		// 			//inform client
		// 			ws.send("three cheers for playfulness! Working from new branch " + newBranchName + " starting from commit " + onHash)

		// 			})
		// 		}
		// 	})
	//	}


		// 	//TODO: 

		// 	//then update merge.html session with current branch name & reload the svg file
		// }

		if (message.includes("git show")) {

			var gitCommand = (message + ":" + "project.cpp");
			var gitHash = message.replace("git show ", "")
			console.log("githash = " + gitHash)

			// exec("node git.js distance " + gitHash, { cwd: __dirname }, (stdout, stderr, err) => {
			// 	console.log(stderr, err, stdout);
			// })

			//path.join("..", "alicenode_inhabitat/project.cpp")
				exec(gitCommand, { cwd: project_path }, (err, stdout) => {
					
					ws.send("show?" + stdout)

					console.log("sending show");
					//console.log(stdout);
					//console.log(projectCPPVersion); 


			});

			
			//console.log(gitCommand);
		}



		if (message.includes("git return to master")){

			 exec("git show master:" + path.join(project_path, "project.cpp"), (stderr, err, stdout) => {
			 ws.send("edit?" + err)

            })
		}


		let q = message.indexOf("?");
		if (q > 0) {
			let cmd = message.substring(0, q);
			let arg = message.substring(q+1);
			switch(cmd) {

			case "client_SVG":

			console.log("\n\n\n\n SVG REQUESTED")

					///// PLO //// Could be useful to see what commands are most used, maybe for 
					// future features https://github.com/jvns/git-workflow

					//problem in the client script when using the "--follow project.cpp" flag, so its
					//been removed for now, but will make using the browser version difficult, unless you can expose the filenames 
					//into the svg. so mouseover tells you which filenames are affected?
					// let alice = spawn('git log --all --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%cN|%s%b|" --stat'), { cwd: project_path }, (stderr) => {


					// });
 
					exec('git log --all --ignore-missing --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%cN|%s%b|" --stat > ' + __dirname + "/tmp/gitlog.txt", {cwd: project_path}, (stdout, stderr, err) => {		 
							//exec buffer size is smaller than our current worktree output, so save it to text file and re-read it. 
						fs.readFile(__dirname + '/tmp/gitlog.txt', 'utf8', function(err, data) {
							if (err) throw err;
							let gitlog = data;

							// on the server
							// given the text of a gitlog output, it will produce a JSON-friendly object representation of it
							// which can be used to render on a client
							function make_graph_from_gitlog(gitlog) {
							// this will collect an object for each commit:
							let commits = [];
							// this will collect the names of commits with no parent:
							let roots = [];
							// the biggest column used so far
							// this is used to compute a commit's column position  
							let maxcolumn = 1;
							// build a lookup-table from hash name to commit object:
							let commit_map = {};
							// keep a cache of what child names have been mentioned so far
							// (this will identify any "root" commits)
							let forward_refs = {};							
							// pull out each line of the source log:
							let lines = gitlog.split(")\n");
							for (let i = 0; i < lines.length; i++) {
							// get each bar-separated term of the line in an array
							let line = lines[i].split("|");
							// the first item is the hash commit
							let hash = line[0];
							if (hash.length) { // skip empty lines
								// create an object representation of the commit
								let commit = {
									hash: hash,
									// an array of hashes of this commit's children
									children: line[1] ? line[1].split(" ") : [],
									// an array of terms of the commit's refs
									ref: line[2] ? line[2].split(", ") : [],
									// the row is determined by the line number
									row: i + 1,
									// the column is initially undetermined (it will be changed later)
									col: 0,
									

									//TODO: add these in. for now they are causing half the commits in the 
									//log to be ignored 
									
									// the date the commit was made
									commit_date: line[3] ? line[3].split(", ") : [],
									//who made the commit?
									committer_name: line[4] ? line[4].split(", ") : [],
									//commit's message
									commit_msg: line[5] ? line[5].split(", ") : [],
									//list the files and change stats associated with each commit
									commit_files: line[6] ? line.slice(6) : []
								};
								// if this commit hasn't been encountered as a child yet,
								// it must have no parent in the graph:
								if (!forward_refs[hash]) {
									roots.push(hash);
									// mark this commit as parent-less
									// not sure if this is really needed
									commit.root = true; 
								}
								
								// add to the list of commits
								commits.push(commit);
								// add to the reverse-lookup by name
								commit_map[hash] = commit;
								
								// also note the forward-referencing of each child
								// (so we can know if a future commit has a parent or not)
								for (let c of commit.children) {
									forward_refs[c] = true;
									}
								}
							}
						
							// depth first traversal
							// to assign columns to each commit
							// and also generate the paths as we go
							
							// we'll start with a list of all the commits without parents:
							// (using a map() to convert hash names into the full object references)
							let stack = roots.map(function(hash) { return commit_map[hash]; }).reverse();
							// we need a cache to remember which items we have visited
							let visited = {};
							
							// the result will populate a list of objects representing the paths between commits:
							let paths = [];
						
							// consume each item on our "todo" stack, until there are none left:
							while (stack.length > 0) {
							// remove top item from stack
							let commit = stack.pop();
							// note that we have now visited this
							// (so we don't process a commit twice by mistake)
							visited[commit.hash] = true;
						
							// if the commit doesn't have a column assigned yet, it must be a root
							if (!commit.col) {
								// create a new empty column for it:
								commit.col = maxcolumn++;
							} else {
								// make sure we have widened our maxcolumn to accommodate this commit
								maxcolumn = Math.max(maxcolumn, commit.col);
							}
						
							// for each child:
							for (let i = commit.children.length - 1; i >= 0; i--) {
								let child_hash = commit.children[i];
								// get the actual child object this hash refers to
								let child = commit_map[commit.children[i]];
								if (child) { // skip if the child commit is not in our source
								// if we haven't visited this child yet, 
								if (!visited[child_hash]) {
									// assign it a new column, relative to parent
									child.col = commit.col + i;
									// and add it to our "todo" stack:
									stack.push(child);
								}
								// add an object representation of this path:
								paths.push({
									from: commit.hash,
									to: child.hash
								});
								}
							}
							}
							// return a full representation of the graph:
							return {
							maxcolumn: maxcolumn,
							roots: roots,
							commits: commits,
							paths: paths
							};
						}
						
						let graph = make_graph_from_gitlog(gitlog);
						let graphjson = pako.deflate(JSON.stringify(graph), { to: 'string'});
						console.log("\n\n\n\n\n gitlog svg sent")

						// send graph as json to client
						ws.send("gitLog?" + graphjson)
					})
				})
			break;

			case "edit": 
				//get the commit message provided by the client
				let commitMsg = arg.substr(0, arg.indexOf("$?$"));
				//get the code 
				let newCode = arg.split('$?$')[1];
				fs.writeFileSync("project.cpp", newCode, "utf8");
				//git add and commit the new changes, including commitMsg
				execSync('git add .', {cwd: project_path }, () => {console.log("git added")});
				execSync('git commit -m \"' + commitMsg + '\"', {cwd: project_path }, () => {console.log("git committed")});
				execSync('git status', {cwd: project_path }, (stdout) => {console.log("\n\n\n\n\n\n\n" + stdout)});

				exec('git log --all --ignore-missing --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%cN|%s%b|" --stat > ' + __dirname + "/tmp/gitlog.txt", {cwd: project_path}, (stdout, stderr, err) => {		 
					//exec buffer size is smaller than our current worktree output, so save it to text file and re-read it. 
				fs.readFile(__dirname + '/tmp/gitlog.txt', 'utf8', function(err, data) {
					if (err) throw err;
					let gitlog = data;

					// on the server
					// given the text of a gitlog output, it will produce a JSON-friendly object representation of it
					// which can be used to render on a client
					function make_graph_from_gitlog(gitlog) {
					// this will collect an object for each commit:
					let commits = [];
					// this will collect the names of commits with no parent:
					let roots = [];
					// the biggest column used so far
					// this is used to compute a commit's column position  
					let maxcolumn = 1;
					// build a lookup-table from hash name to commit object:
					let commit_map = {};
					// keep a cache of what child names have been mentioned so far
					// (this will identify any "root" commits)
					let forward_refs = {};							
					// pull out each line of the source log:
					let lines = gitlog.split(")\n");
					for (let i = 0; i < lines.length; i++) {
					// get each bar-separated term of the line in an array
					let line = lines[i].split("|");
					// the first item is the hash commit
					let hash = line[0];
					if (hash.length) { // skip empty lines
						// create an object representation of the commit
						let commit = {
							hash: hash,
							// an array of hashes of this commit's children
							children: line[1] ? line[1].split(" ") : [],
							// an array of terms of the commit's refs
							ref: line[2] ? line[2].split(", ") : [],
							// the row is determined by the line number
							row: i + 1,
							// the column is initially undetermined (it will be changed later)
							col: 0,
							

							//TODO: add these in. for now they are causing half the commits in the 
							//log to be ignored 
							
							// the date the commit was made
							commit_date: line[3] ? line[3].split(", ") : [],
							//who made the commit?
							committer_name: line[4] ? line[4].split(", ") : [],
							//commit's message
							commit_msg: line[5] ? line[5].split(", ") : [],
							//list the files and change stats associated with each commit
							commit_files: line[6] ? line.slice(6) : []
						};
						// if this commit hasn't been encountered as a child yet,
						// it must have no parent in the graph:
						if (!forward_refs[hash]) {
							roots.push(hash);
							// mark this commit as parent-less
							// not sure if this is really needed
							commit.root = true; 
						}
						
						// add to the list of commits
						commits.push(commit);
						// add to the reverse-lookup by name
						commit_map[hash] = commit;
						
						// also note the forward-referencing of each child
						// (so we can know if a future commit has a parent or not)
						for (let c of commit.children) {
							forward_refs[c] = true;
							}
						}
					}
				
					// depth first traversal
					// to assign columns to each commit
					// and also generate the paths as we go
					
					// we'll start with a list of all the commits without parents:
					// (using a map() to convert hash names into the full object references)
					let stack = roots.map(function(hash) { return commit_map[hash]; }).reverse();
					// we need a cache to remember which items we have visited
					let visited = {};
					
					// the result will populate a list of objects representing the paths between commits:
					let paths = [];
				
					// consume each item on our "todo" stack, until there are none left:
					while (stack.length > 0) {
					// remove top item from stack
					let commit = stack.pop();
					// note that we have now visited this
					// (so we don't process a commit twice by mistake)
					visited[commit.hash] = true;
				
					// if the commit doesn't have a column assigned yet, it must be a root
					if (!commit.col) {
						// create a new empty column for it:
						commit.col = maxcolumn++;
					} else {
						// make sure we have widened our maxcolumn to accommodate this commit
						maxcolumn = Math.max(maxcolumn, commit.col);
					}
				
					// for each child:
					for (let i = commit.children.length - 1; i >= 0; i--) {
						let child_hash = commit.children[i];
						// get the actual child object this hash refers to
						let child = commit_map[commit.children[i]];
						if (child) { // skip if the child commit is not in our source
						// if we haven't visited this child yet, 
						if (!visited[child_hash]) {
							// assign it a new column, relative to parent
							child.col = commit.col + i;
							// and add it to our "todo" stack:
							stack.push(child);
						}
						// add an object representation of this path:
						paths.push({
							from: commit.hash,
							to: child.hash
						});
						}
					}
					}
					// return a full representation of the graph:
					return {
					maxcolumn: maxcolumn,
					roots: roots,
					commits: commits,
					paths: paths
					};
				}
				
				let graph = make_graph_from_gitlog(gitlog);
				let graphjson = pako.deflate(JSON.stringify(graph), { to: 'string'});
				console.log("\n\n\n\n\n gitlog svg sent")

				// send graph as json to client
				ws.send("gitLog?" + graphjson)
			})
		})
				break;

			default:
				console.log("unknown cmd", cmd, "arg", arg);
			}
		} else {
			//console.log("message", message, typeof message);
		}
	});
	
	ws.on('error', function (e) {


		if (e.message === "read ECONNRESET") {
			// ignore this, client will still emit close event
		} else {
			console.error("websocket error: ", e.message);
		}
	});

	// what to do if client disconnects?
	ws.on('close', function(connection) {
		console.log("client connection closed");

		delete sessions[per_session_data.id];

		// tell git-in-vr to push the atomic commits?
	});
	


});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

setInterval(function() {
	//if (statebuf) send_all_clients(statebuf);
	//send_all_clients("fps?"+);
}, 100);

/////////////////////////////////////////////////////////////////////////////////

// SIM LOADER

function loadsim() {
	// TODO: find a better way to IPC commands:
	alice_command("openlib", projectlib);
	
}

function unloadsim() {
	// TODO: find a better way to IPC commands:
	alice_command("closelib", projectlib);
}

//loadsim();

/////////////////////////////////////////////////////////////////////////////////

// EDIT WATCHER

// would be better to be able to use a dependency tracer,
// so that any file that sim.cpp depends on also triggers.

let watcher = chokidar.watch(project_path, {ignored: project_path+"/.git" } );

watcher
.on('error', error => console.log(`Watcher error: ${error}`))
.on('change', (filepath, stats) => {
	//console.log("changed", filepath);
	switch (path.extname(filepath)) {
		case ".h":
		case ".cpp":
		{
			// first, reload & rebuild sim:
			try {
				
				unloadsim();
			
				// let clients know the sources have changed
				send_all_clients("edit?"+fs.readFileSync("project.cpp", "utf8"));
			
				project_build();
				loadsim();

				//git_add_and_commit();

				

			} catch (e) {
				console.error(e.message);
				
			}
			
			// then, commit to git:
			//git_add_and_commit();
			
		} break;
		default: {		
			//console.log(`File ${filepath} has been changed`);
		}
	}
});

///////////////////////////////////////////////////////////////


// Run the code-forensics webserver: 
//TODO: something that pulls through cli args without needing the specific arg's location
function codeForensics(){
    if (process.argv[3] == "--forensics") {
    exec('gulp webserver', {cwd: __dirname});
    }
}
