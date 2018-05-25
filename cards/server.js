const { exec, execSync, spawn, spawnSync, fork } = require('child_process');
const fs = require("fs");
const esgraph = require("esgraph");
const path = require("path");
const esprima = require("esprima");
const Styx = require("styx");
const functionExtractor = require("function-extractor");


const parseContext = require('code-context');
var detective = require('detective');
var getScope = require('get-scope')

var getFunction = require("function-from-file");

var findGlobals = require('find-globals');



const functionsPath = path.join(__dirname, 'extracts/functions/')
const globalsPath = path.join(__dirname, 'extracts/globals/')
const extractsPath  = path.join(__dirname, 'extracts/')

// exec('make cpp', () => {
//     exec('./cpp', (stdout, err, stderr) => {
//         console.log(stdout, err, stderr)
//     })    
// })

// import Esprima from "esprima";
// import * as Styx from "styx";



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

 
 
// // var functions = functionExtractor.parse(source);

// // console.log(functions)
// }
//load js file
var source = fs.readFileSync("./aserver.js", "utf8")
var opts
var nodes
//get list of dependencies and write to json
var requires = detective(source);
fs.writeFileSync(extractsPath + 'requires.json', JSON.stringify(requires, null, 2), 'utf8');

//comb js file for all top-level functions
var functions = functionExtractor.parse(source);
fnsArray = (functions.map(a => a.name))

// possible also of interest: https://www.npmjs.com/package/extract-function
// it can also provide the comments of the function and other extractions

//thirdly: https://www.npmjs.com/package/code-context as it provides line-based context!!:
fs.writeFileSync(extractsPath + 'parseContext.json', JSON.stringify(parseContext(source), null, 2), 'utf8');

//put each found function in its own js file
var functionList = []

fnsArray.forEach(function(entry) {

    var gF = getFunction('./aserver.js', entry);
    //To DO: can you compare the variables inside each function with global variables, and list those here?
    // var localVars = findGlobals(esprima.parse(gF.toString()))
    console.log(entry + "\n\n" + localVars);
    fs.writeFileSync(functionsPath + entry + '.js', gF.toString(), 'utf8');
    functionList.push(gF.toString())

    

})
//push each function to a global json array (this might be part of the data structure Graham asked for) 
fs.writeFileSync(extractsPath + 'functions.json', JSON.stringify(functionList, null, 1), 'utf8');

console.log("document parsed")

//globals
//create the AST. TO DO: get more details from esprima
var ast = esprima.parse(source)

//var scope = getScope.forProgram(ast) // { a: { type: 'Literal', value: 1 } }
var globals = findGlobals(ast)
fs.writeFileSync(extractsPath + 'globals.json', JSON.stringify(globals, null, 1), 'utf8');

fs.writeFileSync(extractsPath + 'ast.json', JSON.stringify(ast, null, 1), 'utf8');


