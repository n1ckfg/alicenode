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

//redit caching
const redis = require("redis"),
redisClient = redis.createClient();

// console.log(process.argv);

const libext = process.platform == "win32" ? "dll" : "dylib";

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "alicenode_inhabitat"));
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");
// console.log("project_path", project_path);
// console.log("server_path", server_path);
// console.log("client_path", client_path);

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

redisClient.on("error", function (err) {
    console.log("Error " + err);
});

redisClient.on('connect', function() {
    console.log('connected');



///// PLO //// Could be useful to see what commands are most used, maybe for 
// future features https://github.com/jvns/git-workflow

//problem in the client script when using the "--follow project.cpp" flag, so its
//been removed for now, but will make using the browser version difficult, unless you can expose the filenames 
//into the svg. so mouseover tells you which filenames are affected?

//TODO eventually add ' --stat' at the end of the command, and figure out a way to add the commit stats to the 
execSync('git log --all --date-order --date=short --pretty="%H|%P|%d|%cd|%cN|%s%b|" --stat', {cwd: project_path}, (stdout, stderr, err) => {
    //when the client script can handle mor data, use this git log --all --date-order --pretty="%ad|%aN|%H|%P|%d|%cN|%cI|%B"'
        //bc for now if you send this data it gives an error :
            //"merge.html:516 Uncaught TypeError: Cannot set property 'col' of undefined"
        


        let gitlog = stderr;

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
    let graphjson = JSON.stringify(graph);
    
    // send graph as json to client
    // ws.send("gitLog?" + graphjson)
    redisClient.set("currentDAG", graphjson, function(err, reply) {
        console.log(reply);
      });
})

});





// redisClient.quit();


// redisClient.hset("hash key", "hashtest 1", "some value", redis.print);
// redisClient.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// redisClient.hkeys("currentDAG", function (err, replies) {
//     console.log(replies.length + " replies:");
//     replies.forEach(function (reply, i) {
//         console.log("    " + i + ": " + reply);
//     });
//     // redisClient.quit();
// });