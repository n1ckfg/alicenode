#!/usr/bin/env node

//const fastcall = require("fastcall")
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
	
// update the worktree list
exec("git worktree prune", () => {
	// delete work tree (if it exists):
	if (fs.existsSync(worktreepath)) {
		fs.unlinkSync(worktreepath);
	}
	
	//get the names of current worktrees
	exec("git worktree list --porcelain | grep -e 'worktree' | cut -d ' ' -f 2", (stderr, err) => {
		for (let i = 0; i < (err.toString().split('\n')).length; i++) {
			let worktreeName = ((err.toString().split('\n'))[i].split("alicenode_inhabitat/")[1]);
			if (worktreeName !== undefined) {
				fs.appendFile(worktreepath, worktreeName + "\n", function (err) {
					if (err) {
						console.log(err)                            
					} else {
						console.log("worktreeList.txt updated")
					}
				}) 
			}   
		}
	})
})

/////////////////////////////////////////////////////////////////////////////////

// BUILD PROJECT
function project_build() {
	
	let out = process.platform == "win32"
		? execSync('build.bat "'+server_path+'"') 
		: execSync('sh build.sh "'+server_path+'"');
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
	}
}

/////////////////////////////////////////////////////////////////////////////////

// BUILD REPO GRAPH

//old method (hoping to phase out)
// try {
// 	execSync('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=project.cpp' + ' > ' + path.join(server_path, "repo_graph.dot"), {cwd: project_path }, () => {console.log("made the repo_graph.dot")});
// 	//convert the digraph to svg
// 	execSync('dot -Tsvg ' + path.join(server_path, "repo_graph.dot") + ' -o ' + path.join(client_path, "repo_graph.svg"), () => {console.log("made repo_graph.svg")});
// 	console.log("\nRebuilt Repo Graph\n");
// } catch (e) {
// 	console.error(e.toString());
// }

//possible new method 1: this one is really slick, and it uses git log, so should be faster than the rev-list/parse method above and below. 
// I'll need to crawl around and find all the source files referenced in the html,
//as they are not hosted in some git repo. but yeah, getting this one to work would be pretty sweet
// http://bit-booster.com/graph.html
//*NOTE* see if the git log 'pretty' part of the code can include the date, author, [commit message would be GREAT], and more, so you can then expose more into the svg
var gitlog;
var svg;

// exec('git log --all --date-order --pretty="%H|%P|%d|%cN" --follow project.cpp', {cwd: project_path}, (stdout, stderr, err) => {
// gitlog = stderr;

// console.log(gitlog)

// function make_svg_from_gitlog(gitlog) {
//     let rowsize = 20;
//     let colsize = 10;
  
//     function col_hue(col) { return col*30; }
  
//     let lines = gitlog.split("\n");
//     let commit_list = [];
//     let commit_map = {};
//     for (let i = 0; i < lines.length; i++) {
//       let line = lines[i].split("|");
//       let commit = {
//         hash: line[0],
//         children: line[1] ? line[1].split(" ") : [],
//         ref: line[2] ? line[2].split(", ") : [],
//         row: i+1
//       };
//       commit_list.push(commit);
//       commit_map[commit.hash] = commit;
//     }
  
//     // depth first traversal
//     // to assign columns to each commit
//     // and also generate the paths as we go
//     let first_commit = commit_list[0];
//     first_commit.col = 1;
//     let stack = [  first_commit ];
//     let visited = {};
//     let paths = [];
//     while (stack.length > 0) {
//       let parent = stack.pop();
//       visited[parent.hash] = true;
//       parent.x = parent.col * colsize;
//       parent.y = parent.row * rowsize;
  
//       // add children to stack:
//       for (let i=parent.children.length-1; i>=0; i--) {
//         let child_hash = parent.children[i];
//         let child = commit_map[parent.children[i]];
//         if (!visited[child_hash]) {      
//           child.col = (parent.col + i);
//           stack.push(child);
//         }
//         // add a path:
//         paths.push({
//           from: parent,
//           to: child
//         });
//       }
//     }
  
//     let svg = ['<svg width=100% height=100% version="1.1" xmlns="http://www.w3.org/2000/svg">'];
  
//     for (let i in commit_list) {
//       let commit = commit_list[i];
//       svg.push(`<circle id="${commit.hash}" cx="${commit.x}" cy="${commit.y}" r="4" style="fill:hsl(${col_hue(commit.col)}, 100%, 30%);" />`); 
//     }
  
//     for (let i in paths) {
//       let path = paths[i];
//       let from = path.from;
//       let to = path.to;
  
//       let d = `M${from.x},${from.y}`;
//       let hue = col_hue(from.col);
//       if (to.col > from.col) {
//         // new branch
//         hue = col_hue(to.col);
//         let branch = {
//           x: to.x,
//           y: from.y + rowsize/2
//         }
//         d += `L${branch.x},${branch.y}`;
  
//       } else if (to.col < from.col) {
//         // merge branch
//         let branch = {
//           x: from.x,
//           y: to.y - rowsize/2
//         }
//         d += `L${branch.x},${branch.y}`;
//       } 
//       // regular commit
//       d += `L${to.x},${to.y}`;
  
//       svg.push(`<path id="path_${i}" d="${d}" stroke-width="1" fill="transparent"  style="stroke:hsl(${hue}, 100%, 30%);" />`); 
//     }
//     svg.push("</svg>");
//     svg = svg.join("\n");
// 	return svg;

//   }
//   var svg = make_svg_from_gitlog(gitlog);

 // sendSVG(svg);
  //ws.send("?update_gitGraph " + svg)
//})
//possible new method 2 (using a different python script that provides author names and evenutally will add dates an other details... its very slow though...)
//seems to be a bit easier to edit, compared to the git-big-picture. 
//////////////TODO::: MUST figure out how to restrict the python script to only mapping project.cpp. 
///////////////////// I did this once, by adding ' -- project.cpp' to line 42 in git-graph.py, but the resulting digraph had many disconnected lines
// try {
// 	execSync('python3 git-graph.py > ' + path.join("..", "alicenode/repo_graph.dot"), {cwd: project_path }, () => {console.log("made the repo_graph.dot")});
// 	//convert the digraph to svg
// 	execSync('dot -Tsvg ' + path.join("..", "alicenode/repo_graph.dot") + ' -o ' + path.join("..", "alicenode/client/repo_graph.svg"), () => {console.log("made repo_graph.svg")});
// 	console.log("\nRebuilt Repo Graph\n");
// } catch (e) {
// 	console.error(e.toString());
// }

// possible new method 3: https://github.com/tclh123/commits-graph
//although, this one is maybe not as feature-ready as method 1...
///// PLO //// Could be useful to see what commands are most used, maybe for 
// future features https://github.com/jvns/git-workflow



// UPDATE GIT REPO:

function git_add_and_commit() {
	try {
				
		execSync('git add .', {cwd: project_path }, () => {console.log("git added")});
		execSync('git commit -m "client updated project"', {cwd: project_path }, () => {console.log("git committed")});
		//create digraph from git history of project.cpp
		execSync('git-big-picture --graphviz --all --tags --branches --roots --merges --bifurcations --file=project.cpp' + ' > ' + path.join(server_path, "repo_graph.dot"), {cwd: project_path}, () => {console.log("made the repo_graph.dot")});
		//convert the digraph to svg
		execSync('dot -Tsvg ' + path.join(server_path, "repo_graph.dot") + ' -o ' + path.join(client_path, "repo_graph.svg"), () => {console.log("made repo_graph.svg")});
		execSync("git log --pretty=format:'{%n “%H”: \"%aN <%aE>\", \"%ad\", \"%f\"%n},' $@ | perl -pe 'BEGIN{print \"[\"}; END{print \"]\n\"}' | perl -pe \'s/},]/}]/\' > " + path.join(client_path, "gitlog.json"), {cwd: server_path}, () => {
			console.log("updated ../client/gitlog.json")
		})

		send_all_clients("updateRepo?");

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
	process.exit();
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
			newWorkTree = message.replace("addWorktree ", "?")
			console.log(newWorkTree)
			exec("git worktree add --lock --no-checkout " + message.replace("addWorktree ", ""), (stdout, err, stderr) => {

				updateWorktreeList();

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
					//console.log(err);
					//console.log(stdout);
					ws.send("show?" + stdout)

					projectCPPVersion = stdout;

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
					//problem in the client script when using the "--follow project.cpp" flag, so its
					//been removed for now, but will make using the browser version difficult, unless you can expose the filenames 
					//into the svg. so mouseover tells you which filenames are affected?
					exec('git log --all --date-order --pretty="%H|%P|%d|"', {cwd: project_path}, (stdout, stderr, err) => {
						//when the client script can handle mor data, use this git log --all --date-order --pretty="%ad|%aN|%H|%P|%d|%cN|%cI|%B"'
							//bc for now if you send this data it gives an error :
							 	//"merge.html:516 Uncaught TypeError: Cannot set property 'col' of undefined"
						




												// on the server
						// given the text of a gitlog output, it will produce a JSON-friendly object represntation of it
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
							let lines = gitlog.split("\n");
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
								col: 0
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
						let graphjson = JSON.stringify(graph);
						
						// send graph as json to client
						ws.send("gitLog?" + graphjson)
					})
			break;

			case "edit": 
				console.log(arg);
				fs.writeFileSync("project.cpp", arg, "utf8");
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
	
	// send a handshake?
	ws.send("state?"+fs.readFileSync("state.h", "utf8"));
	if (statebuf) ws.send(statebuf);
	ws.send("edit?"+fs.readFileSync("project.cpp", "utf8"));

});

server.listen(8080, function() {
	console.log('server listening on %d', server.address().port);
});

setInterval(function() {
	if (statebuf) send_all_clients(statebuf);
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
	console.log("changed", filepath);
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

			} catch (e) {
				console.error(e.message);
			}
			
			// then, commit to git:
			git_add_and_commit();
			
		} break;
		case ".glsl": {
			
			// first, reload GPU resources:
			alice_command("reloadgpu", "");

			// then, commit to git:
			git_add_and_commit();

		} break;
		default: {		
			console.log(`File ${filepath} has been changed`);
		}
	}
});

///////////////////////////////////////////////////////////////

// Run the code-forensics webserver: 
exec('gulp webserver', {cwd: __dirname});

