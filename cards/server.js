const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const fs = require("fs");
const path = require("path");
const mmapfile = require('mmapfile');
const Reader = require('buffer-read');
const { StringDecoder }= require('string_decoder');
var toArrayBuffer = require('to-arraybuffer')

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const url = require('url');

// derive project to launch from first argument:
process.chdir(process.argv[2] ||  path.join("../..", "alicenode_inhabitat"));
const project_path = process.cwd();
console.log(project_path)
const server_path = __dirname;
const client_path = path.join(server_path, "client");

let deck;
let src;
let errors;

//get the source code of test.h:

    //this is commented out for now, as the regen can't deal with StructDecl yet...(?)
    // execSync('node regen.js test.json', {cwd: __dirname + "/cpp2json/"}, (stderr, err, stdout) => {
    //     //console.log("deck folded")
    //     if (stderr !== null){
            
    //         src = (stderr)
    //     } else if (err !== null){
            
    //         src = (err)
    //     } else if (stdout !== null){
            
    //         src = (stdout)
    //     }
    //     console.log(JSON.parse(src))
    // })

    //so this is being run in the above code's place, for now (its a bootstrap):
    src = fs.readFileSync(__dirname + "/cpp2json/test.h", "utf8")
   // console.log(src)
   
//get the updated json of test.h (see ./cards/cpp2json)
getCpp2json();
//console.log( __dirname + "/cpp2json/")
function getCpp2json(){
    
    deck = fs.readFileSync(__dirname + "/cpp2json/test.json", "utf8") //the temp name for the overall datastructure we will add to throughout this document
    //console.log(deck)
    //not working for the time being... it breaks the client's ast graph
    // exec('./cpp2json test.h', {cwd: __dirname + "/cpp2json/"}, (stderr, err, stdout) => {
    //     console.log("deck folded")
    //     if (stderr !== null){
            
    //         deck = (stderr)
    //     } else if (err !== null){

    //         deck = (err)
    //     } else if (stdout !== null){

    //         deck = (stdout)
    //     }
    //    // console.log(deck.split("{"))

    //IMPORTANT: when you end up using the above commented out code (you will), you need to include the code at the bottom in order to separate out any parser errors from the ast!
    //    //if the child process results in any errors, lets isolate those serrors and report them to the cards editor!
    //    //if no errors, the 0th element of deck will be "{", so if it isnt...
    //     if (deck.charAt[0] !== "{"){
    //         //get the index of the start of the ast-json
    //         let q = deck.indexOf("{")
    //         if (q > 0) {
    //             //put the errors into a variable
    //             errors = deck.substring(0, q);
    //             //slice the errors off the original deck
    //             deck = deck.substring(q);
    //             // console.log(deck)
    //         }
            
    //     }
    //     // let q = deck.indexOf("?");
    //     // if (q > 0) {
    //     //     let cmd = message.substring(0, q);
    //     //     let arg = message.substring(q+1);

    // })
  
}

let stateSource;
let stateAST;
let state = []; //we'll send this to the client

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

let statebuf 
try {
    buffSize = fs.statSync("state.bin").size
	statebuf = mmapfile.openSync("state.bin", buffSize, "r+");
    console.log("mapped state.bin, size "+statebuf.byteLength);

    


		// range = statebuf.slice(11534336, 11534336 + 2304)
        // reader = new Reader(statebuf)
        // reader.offset = 78408704;
        // console.log(reader.slice(4))
        // console.log(parseInt(range).toString(2))
	// slow version:
	// setInterval(function() {
	// 	let idx = randomInt(0, 10) * (4*3);
	// 	let v = statebuf.readFloatLE(idx);
	// 	v = v + 0.01;
	// 	if (v > 1.) v -= 2.;
	// 	if (v < -1.) v += 2.;
	// 	//statebuf.writeFloatLE(v, idx);
	// }, 1000/120);
} catch(e) {
	console.error("failed to map the state.bin:", e.message);
}


getState();

function getState(){
    //get sourcecode
    stateSource = fs.readFileSync(__dirname + "/cpp2json/state.h").toString();
    stateSource = JSON.stringify(stateSource)

    exec('./cpp2json ' + path.join(project_path + '/state.h') + ' state.json', {cwd: __dirname + "/cpp2json" }, (stderr, err, stdout) => {
        console.log("state.h traversed")
        /*
        if (stderr !== null){
            
            stateAST = (stderr)
        } else if (err !== null){

            stateAST = (err)
        } else if (stdout !== null){

            stateAST = (stdout)
        }*/
        stateAST = JSON.parse(fs.readFileSync(path.join(__dirname, "/cpp2json", "state.json"), "utf-8"));
        // console.log(deck.split("{"))

        //console.log(stateAST)

        //    stateAST = JSON.stringify(stateAST)
        //console.log(stateAST)

        //if the child process results in any errors, lets isolate those serrors and report them to the cards editor!
       //if no errors, the 0th element of deck will be "{", so if it isnt...
       /*
        if (stateAST.charAt[0] !== "{"){
            //console.log('error')
            //get the index of the start of the ast-json
            let q = stateAST.indexOf("{")
            //console.log(q)
            if (q > 0) {
                //put the errors into a variable
                stateASTErrors = stateAST.substring(0, q);
                //slice the errors off the original deck
                stateAST = JSON.parse(stateAST.substring(q));
                // console.log(deck)
            }
        }*/
        //console.log(stateAST)
        // let q = stateAST.indexOf("?");
        // if (q > 0) {
        //     let cmd = stateAST.substring(0, q);
        //     let arg = stateAST.substring(q+1);
        //         console.log(arg)
        // }
        Object.keys(stateAST.nodes).forEach(function(key) {
            if (stateAST.nodes[key].name == "State") {
               // console.log(arg.nodes[key].nodes)
        
                Object.keys(stateAST.nodes[key].nodes).map(function(objectKey, index) {
                    let value = stateAST.nodes[key].nodes[objectKey];
                    paramName = value.name;
                    //IMPORTANT: we'll actually get the param value by referencing the offset and sizeof in the stateAST per fieldDecl, but the offset is not working at the moment... so for now, enjoy some bogus data!
                    // paramValue = Math.floor(Math.random() * 20)
                    // console.log(value.offsetof, value.sizeof)

                    // console.log("arrrr", paramName, value.type, value.offsetof, value.sizeof);
                    //need to write switch based on the type of the node. see nodejs buffer doc see buff.write types (i.e. buff.writeInt32, buff.writeUInt32BE)
                    let type = value.type;
                    let offset = value.offsetof
                    switch (type) {

                        case "float":
                        // let obj = new Object;
                        let paramValue = statebuf.readFloatLE(offset);

                        // let objArray = [paramValue, type, offset]
                        // obj[paramName] = objArray

                        //console.log(obj);
                        state.push({paramName, paramValue, type, offset})

                        //console.log("float detected " + paramName, paramValue)
                        break;

                        default:
                        state.push({paramName, type})

                    }

                });
            }
        //console.log(arg.nodes[key].name)
        })


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

    //console.log(deck)
    ws.send("deck?" + deck);
    ws.send("src?" + src)
    //if the ast parser produced any warnings/errors:
    ws.send("ast_messages?" + errors)

    //temporary
//    let state = {};
    // state["numcritters"] = 45;
    // state["foodAvailability"] = 0.02

    ws.send("state?" + JSON.stringify(state))
    ws.send("state.h?" + stateSource)
    

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
            case "stateUpdate":
                //stateUpdate = JSON.stringify(arg)
                //console.log(arg)
                //console.log(state)
                let theName = arg.substr(0,arg.indexOf(' '));
                let theValue = arg.substr(arg.indexOf(' ')+1);
                //console.log(theName, theValue)

                function findObj(result) { 
                    return result.paramName === theName;
                }
                
                let thisObj = state.find(findObj); 
                //console.log(thisObj.offset)

                statebuf.writeFloatLE(theValue, thisObj.offset);

            break;
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