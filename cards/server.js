const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const fs = require("fs");
const esgraph = require("esgraph");
const path = require("path");
const esprima = require("esprima");
const Styx = require("styx");
const functionExtractor = require("function-extractor");
const estraverse = require("estraverse");
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const url = require('url');


const parseContext = require('code-context');
var detective = require('detective');
var getScope = require('get-scope')

var getFunction = require("function-from-file");
var LineByLineReader = require('line-by-line');


const findGlobals = require('find-globals');
const functionsPath = path.join(__dirname, 'extracts/functions/')
const globalsPath = path.join(__dirname, 'extracts/globals/')
const extractsPath  = path.join(__dirname, 'extracts/')

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("..", "cards"));
const project_path = process.cwd();
const server_path = __dirname;
const client_path = path.join(server_path, "client");
var escope = require('escope')

//SETUP
//load js file
var source = fs.readFileSync("./aserver.js", "utf8")
//create the abstract syntax tree
var ast = esprima.parse(source, {loc: true, range: true})

// console.log(json);

// var source;
// // First I want to read the file
// fs.readFileSync('./aserver.js', 'utf8', function read(err, data) {
//     if (err) {
//         throw err;
//     }
//     //load the js file, remove the #! node entry on first line (if there is one)
//     source = data.replace(/^#!(.*\n)/, '');

//     // Invoke the next step here however you like
//     //console.log(content);   // Put all of the code here (not the best solution)
//     processFile(source);          // Or put the next step in a function and invoke it
//     console.log(functionExtractor.parse(source))

// });

    
//     // var tree = esprima.parseScript(source, { range: true, loc: true, comment: true }, function (node, metadata) {
//     //    // console.log(node.type, metadata);
//     // } ) 
    
//     // fs.writeFileSync('./ast.json', JSON.stringify(tree, null, 2), 'utf8');
//     // //console.log(node.type);


var functionList = {}

// // var functions = functionExtractor.parse(source);

// // console.log(functions)
// }

var opts
var nodes



//objects:
let deck = {} //the temp name for the overall datastructure we will add to throughout this document

let cards = {}; //json object containing all card data: function, code data, attribute(s)
let globals = {} // contains any variable declared at file's root
let locals = {} // contains any variables declared within a function's scope
var requireStatements = {} //containing all of the require statements

//get the updated json of test.h (see ./cards/cpp2json)
getCpp2json();
console.log( __dirname + "/cpp2json/")
function getCpp2json(){
    exec('./cpp2json test.h > test.json && cat test.json', {cwd: __dirname + "/cpp2json/"}, (stderr, err, stdout) => {
        console.log("deck folded")
        if (stderr !== null){
            
            deck = (stderr)
        } else if (err !== null){
            
            deck = (err)
        } else if (stdout !== null){
            
            deck = (stdout)
        }


    })

     
     
     
}


////////////////////////HTTP SERVER////////////////////////



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
    
    ws.send("deck?" + deck);

	sessions[per_session_data.id] = per_session_data;

	console.log("server received a connection, new session " + per_session_data.id);
	console.log("server has "+wss.clients.size+" connected clients");
	
	const location = url.parse(req.url, true);
	// You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
	// respond to any messages from the client:
	ws.on('message', function(message) {

        // if (message.includes("git return to master")){
		// 	console.log("\n\n\n\n git return to master triggered \n\n\n\n\n\n")
		// 	 exec("git show master:" + path.join(project_path, "project.cpp"), (stderr, err, stdout) => {
		// 	 ws.send("edit?" + err)

        //     })
		// }


		let q = message.indexOf("?");
		if (q > 0) {
			let cmd = message.substring(0, q);
			let arg = message.substring(q+1);
			switch(cmd) {
			
				// case "newUser":
				// 	console.log(arg)
				// break;

//CLIENT: ///////////////////////////////////////////////////////
	//Add user

            case "newUser":
            
        break;
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











///////// older code: this is for the javascript ast parser for cards:


/* this is above the http server for now,  */
///////////////////////AST PARSER/////////////////////////

// //comb js file for all top-level functions
// var functions = functionExtractor.parse(source);
// fnsArray = (functions.map(a => a.name))

// //all functions!
// var allFunctions = getFunction('./aserver.js', fnsArray);


// //get list of dependencies and write to json
// var requires = detective(source);
// fs.writeFileSync(extractsPath + 'requires.json', JSON.stringify(requires, null, 2), 'utf8');



//DONE: array of all the require statements

// //read whole document line by line
// lr = new LineByLineReader('aserver.js');

// lr.on('line', function (line) {

//     //get the full require statements

//     if (line.includes("require")){
//         //console.log(line)
//         requireStatements["required"] = line;
//       //  requireStatements.push(line)
//     }

//         // // 'line' contains the current line without the trailing newline character.
//         // if (line.match("const") && line.includes("require")){
                    


//         // }
//         // if (line.match("var") && line.includes("require")){
            
//         //     requireStatements.push({
//         //         required: line,
//         //         type: "var"

//         //     })    
//         // }
//         // if (line.match("let") && line.includes("require")){
            
//         //     requireStatements.push({
//         //         required: line,
//         //         type: "let"

//         //     })    
//         // }
// });


// lr.on('end', function () {
//     // All lines are read, file is closed now.
//     console.log("requireStatements collected")
//     parseAST();
// });



//////////////// parse JS //////////////
// var globalScope = escope.analyze(ast).scopes[0];
// console.log(globalScope)

// function parseAST(){
//     var scopeChain = [];

//     estraverse.traverse(ast, {
//     enter: enter,
//     leave: leave
//     });

//     function enter(node){
//     if (createsNewScope(node)){
//         scopeChain.push([]);
//     }
//     if (node.type === 'VariableDeclarator'){
//         var currentScope = scopeChain[scopeChain.length - 1];
//         currentScope.push(node.id.name);
//     }
//     }

//     function leave(node){
//     if (createsNewScope(node)){
//         var currentScope = scopeChain.pop();
//         printScope(currentScope, node);
//     }
//     }


//     function printScope(scope, node){


//         var varsDisplay = scope.join(', ');
//         //   console.log(varsDisplay)
//         if (node.type === 'Program'){
//             // console.log('\n\n\n\n\nVariables declared in the global scope:', 
//             //   varsDisplay);
//             globals["globals"] = varsDisplay
//             ///console.log(varsDisplay)

//         }   else {
//             if (node.id && node.id.name){

//                 //if a function doesn't have any declared vairables, ignore it
//                 if (varsDisplay) {     
//                 let thisFunction = allFunctions[node.id.name];

//                 //add function code and attributes to a card!
//                 cards[node.id.name] = {
//                     start: node.body.loc.start,
//                     end: node.body.loc.end,
//                     //type: node.type, //probably redundant, right?
//                     declared: varsDisplay,
//                     id: node.id,
//                     params: node.params,
//                     code: thisFunction.toString()

//                     //alternate approach to finding locally declared vars:
//                     //console.log(node.body.body)
//                     //*NOTE* there are several other AST nodes available but not being used in my script. see console.log(node), i.e. 'expression', or 'async', etc.
//                 };
//                 }   else {

//                     cards[node.id.name] = {};


//                 }

//             //if variables are not declared in a function, but are in the globals
//             //scope, does that mean they reference/act on the global var?
//         }   else {
//         //   console.log('Variables declared in anonymous function:',
//         //     varsDisplay);
//             }
//         }


//     }



//     function createsNewScope(node){
//     return node.type === 'FunctionDeclaration' ||
//         node.type === 'FunctionExpression' ||
//         node.type === 'Program';
// }


// console.log("document parsed")

// console.log(cards)
// console.log(globals)

// deck.push(globals)
// console.log("globals collected")
// deck.push(cards)
// console.log("functions collected")

// deck.push(requireStatements)
// console.log("deck folded")
// fs.writeFileSync(extractsPath + 'deck.json', JSON.stringify(deck, null, 2), 'utf8');
// }
//To DO: can you compare the variables inside each function with global variables, and list those here?
    // var localVars = findGlobals(esprima.parse(gF.toString()))
    //console.log(entry + "\n\n" + localVars);
    // fs.writeFileSync(functionsPath + entry + '.js', gF.toString(), 'utf8');





// possible also of interest: https://www.npmjs.com/package/extract-function
// it can also provide the comments of the function and other extractions

//thirdly: https://www.npmjs.com/package/code-context as it provides line-based context!!:
// fs.writeFileSync(extractsPath + 'parseContext.json', JSON.stringify(parseContext(source), null, 2), 'utf8');


/*
//globals


//var scope = getScope.forProgram(ast) // { a: { type: 'Literal', value: 1 } }
var globals = findGlobals(ast)
fs.writeFileSync(extractsPath + 'globals.json', JSON.stringify(globals, null, 1), 'utf8');

fs.writeFileSync(extractsPath + 'ast.json', JSON.stringify(ast, null, 1), 'utf8');

// exec('magic --port 12345', (err, stderr, stdout) => {
//     console.log(err, stderr, stdout, "Magic is running on port 3000")
// })


//The following code will output all variables declared at the root of a file.
// via https://github.com/estools/estraverse
// estraverse.traverse(ast, {
//     enter: function (node, parent) {
//         if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
//             return estraverse.VisitorOption.Skip;
//     },
//     leave: function (node, parent) {
//         if (node.type == 'VariableDeclarator')
//           console.log(node.id.name)
//           if (node.id.name !== "undefined" || null) {
//             let requireName = (node.id.name)
//             requireStatements.push(requireName.toString())
//           }

//     }
// });







//



////////


/////////////////////////////////////////////////////////////////////////////////
 
// CONFIGURATION


// const libext = process.platform == "win32" ? "dll" : "dylib";


// const projectlib = "project." + libext;

// //let userName = "Guest"; //temporary: default to guest when using the client app
// let gitHash;
// let projectCPPVersion; //when a version of the project.cpp is requested by a client and placed in the right pane, store it here
// let worktreepath = path.join(client_path, "worktreeList.txt");
// let worktreeJSON = []; //list of worktrees in project_path

// let commitMsg = "client updated project"; //default commit message if nothing given? 

// //if alice is already running from a previous crash, then terminate it
// var terminate = require('terminate');

// const find = require('find-process');




// /////////////////////////////////////////////////////////////////////////////////

// // HTTP SERVER

// let sessionId = 0;
// let sessions = [];

// const app = express();
// app.use(express.static(client_path))
// app.get('/', function(req, res) {
// 	res.sendFile(path.join(client_path, 'index.html'));

// });
// //app.get('*', function(req, res) { console.log(req); });
// const server = http.createServer(app);

// // add a websocket service to the http server:
// const wss = new WebSocket.Server({ server });

// // send a (string) message to all connected clients:
// function send_all_clients(msg) {
// 	wss.clients.forEach(function each(client) {
//        client.send(msg);
//     });
// }


// // whenever a client connects to this websocket:
// wss.on('connection', function(ws, req) {
		
// 	let per_session_data = {
// 		id: sessionId++,
// 		socket: ws,


// 	};

// 	// //get the names of current worktrees
// 	// exec("git worktree list --porcelain | grep -e 'worktree' | cut -d ' ' -f 2 | grep -o \"+.*\"", {cwd: project_path}, (stderr, err) => {  
	
// 	// 	//send updated list to client
// 	// 	err = err.split(/\n/g).filter(String)
// 	// 	// worktrees = [];
// 	// 	        // err.forEach(function(element) {
// 	// 			// console.log("test " + element)
// 	// 			// worktrees.push(element)
// 	// 			// })
// 	// 			//console.log(element)
// 	// 			// console.log(Array.isArray(err))
// 	// 			// console.log(typeof err[1])
// 	// 	ws.send("worktreeList?" + JSON.stringify(err))

// 	// }) 


// 	sessions[per_session_data.id] = per_session_data;

// 	console.log("server received a connection, new session " + per_session_data.id);
// 	console.log("server has "+wss.clients.size+" connected clients");
	
// 	const location = url.parse(req.url, true);
// 	// You might use location.query.access_token to authenticate or share sessions
// 	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
	
// 	// respond to any messages from the client:
// 	ws.on('message', function(message) {
// 		console.log(message)

//     //        example:
// 		// if (message.includes("getCurrentBranch")){
// 		// 	exec("git rev-parse --abbrev-ref HEAD", { cwd: project_path }, (stdout, stderr, err) => {
// 		// 		//console.log("this it sshshs kjdlfj;ldkslfj" + stderr.replace(" string", ""));
// 		// 		ws.send("branchname?" + stderr.replace("\n", ""))
// 		// 		//console.log("branchname?" + stderr.replace("\n", ""))
// 		// 		})
// 		// }
		

		


// 		let q = message.indexOf("?");
// 		if (q > 0) {
// 			let cmd = message.substring(0, q);
// 			let arg = message.substring(q+1);
// 			switch(cmd) {

//             case "foo":
//             break;
			

// 			default:
// 				console.log("unknown cmd", cmd, "arg", arg);
// 			}
// 		} else {
// 			//console.log("message", message, typeof message);
// 		}
// 	}); 
	
// 	ws.on('error', function (e) {


// 		if (e.message === "read ECONNRESET") {
// 			// ignore this, client will still emit close event
// 		} else {
// 			console.error("websocket error: ", e.message);
// 		}
// 	});

// 	// what to do if client disconnects?
// 	ws.on('close', function(connection) {
// 		console.log("client connection closed");

// 		delete sessions[per_session_data.id];

// 		// tell git-in-vr to push the atomic commits?
// 	});
	


// });

// server.listen(8080, function() {
// 	console.log('server listening on %d', server.address().port);
// });

// ///////////////////////////////////////////////////////////////


*/