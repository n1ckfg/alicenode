/*
c/o http://tobyho.com/2013/12/02/fun-with-esprima/
This program will take the input file name as its a parameter and 
report for each assignment in the program, which identifier was 
assigned to.
*/


// var fs = require('fs');
// var esprima = require('esprima');
// var estraverse = require('estraverse');
// var magicWindow = require('magic-window');

// var filename = process.argv[2];
// console.log('Processing', filename);
// var ast = esprima.parse(fs.readFileSync(filename));
// magicWindow.traverse(ast, {
//   enter: function(node){
//     if (node.type === 'AssignmentExpression'){
//       console.log('Encountered assignment to', node.left.name);
//     }
//   }
// });

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

const parseContext = require('code-context');
var detective = require('detective');
var getScope = require('get-scope')

var getFunction = require("function-from-file");
var LineByLineReader = require('line-by-line');


const findGlobals = require('find-globals');


var source = fs.readFileSync("./aserver.js", "utf8")

var ast = esprima.parse(source);
var escope = require('escope');


var scopeManager = escope.analyze(ast);

var currentScope = scopeManager.acquire(ast);   // global scope

estraverse.traverse(ast, {
    enter: function(node, parent) {
        // do stuff
        
        if (/Function/.test(node.type)) {
            currentScope = scopeManager.acquire(node);  // get current function scope
        }
    },
    leave: function(node, parent) {
        if (/Function/.test(node.type)) {
            currentScope = currentScope.upper;  // set to parent scope
            console.log(currentScope)

        }
        
        // do stuff
    }
});