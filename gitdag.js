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



function make_svg_from_gitlog(gitlog) {
    let rowsize = 20;
    let colsize = 10;
  
    function col_hue(col) { return col*30; }
  
    let lines = gitlog.split("\n");
    let commit_list = [];
    let commit_map = {};
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].split("|");
      let commit = {
        hash: line[0],
        children: line[1] ? line[1].split(" ") : [],
        ref: line[2] ? line[2].split(", ") : [],
        row: i+1
      };
      commit_list.push(commit);
      commit_map[commit.hash] = commit;
    }
  
    // depth first traversal
    // to assign columns to each commit
    // and also generate the paths as we go
    let first_commit = commit_list[0];
    first_commit.col = 1;
    let stack = [  first_commit ];
    let visited = {};
    let paths = [];
    while (stack.length > 0) {
      let parent = stack.pop();
      visited[parent.hash] = true;
      parent.x = parent.col * colsize;
      parent.y = parent.row * rowsize;
  
      // add children to stack:
      for (let i=parent.children.length-1; i>=0; i--) {
        let child_hash = parent.children[i];
        let child = commit_map[parent.children[i]];
        if (!visited[child_hash]) {      
          child.col = (parent.col + i);
          stack.push(child);
        }
        // add a path:
        paths.push({
          from: parent,
          to: child
        });
      }
    }
  
    let svg = ['<svg width=100% height=100% version="1.1" xmlns="http://www.w3.org/2000/svg">'];
  
    for (let i in commit_list) {
      let commit = commit_list[i];
      svg.push(`<circle id="${commit.hash}" cx="${commit.x}" cy="${commit.y}" r="4" style="fill:hsl(${col_hue(commit.col)}, 100%, 30%);" />`); 
    }
  
    for (let i in paths) {
      let path = paths[i];
      let from = path.from;
      let to = path.to;
  
      let d = `M${from.x},${from.y}`;
      let hue = col_hue(from.col);
      if (to.col > from.col) {
        // new branch
        hue = col_hue(to.col);
        let branch = {
          x: to.x,
          y: from.y + rowsize/2
        }
        d += `L${branch.x},${branch.y}`;
  
      } else if (to.col < from.col) {
        // merge branch
        let branch = {
          x: from.x,
          y: to.y - rowsize/2
        }
        d += `L${branch.x},${branch.y}`;
      } 
      // regular commit
      d += `L${to.x},${to.y}`;
  
      svg.push(`<path id="path_${i}" d="${d}" stroke-width="1" fill="transparent"  style="stroke:hsl(${hue}, 100%, 30%);" />`); 
    }
    svg.push("</svg>");
    svg = svg.join("\n");
    return svg;
  }
  
  //to do: replace the gitlog contents below using an exec function
//exec("")
  let gitlog = `539495f|a9d6243|master
  a9d6243|8e17cfd dba91e2 cdadcd7 c954c3e 658b04e 8efa6b6 a2d7854
  a2d7854|9d95af8
  8efa6b6|9d95af8|test_branch
  9d95af8
  658b04e|9317a9b
  c954c3e|9317a9b|tag: tag1
  9317a9b
  cdadcd7|f4046fa
  dba91e2|f4046fa|tag: tag5, tag: tag6
  f4046fa
  8e17cfd|e34b4d0
  e34b4d0|5ff6ce7
  5ff6ce7|d86e7ce|tag: tag2, tag: tag3, another_branch
  d86e7ce|44f3ead f537ede 79e536a
  f537ede|653a6f6
  79e536a|653a6f6 a1a7ab4
  44f3ead|f2e7f46 653a6f6
  653a6f6|422dd3c d3c5150
  a1a7ab4|649a524
  d3c5150|649a524
  f2e7f46|422dd3c
  422dd3c|649a524
  649a524|90cd17a
  90cd17a|76092f0 f37def6 0f8187b c44a61f 0b6fd60 66537bf f9c5353 17f5428 3c52fb4
  76092f0
  3c52fb4
  17f5428||tag: x, tag: y, tag: z
  f9c5353
  66537bf
  0b6fd60
  c44a61f
  0f8187b
  f37def6`;
  
  

 //this  
  var svg = make_svg_from_gitlog(gitlog);
ws.send("?update_gitGraph " + svg)
///TODO: pass the svg data over ws to merge.html. 

//place this code below in merge.html
//in html code:<div id="gitgraph" />
//in script code: $("#gitgraph").html(svg);


//document.write(svg);

//console.log(svg);

//console.log(commit_list);
//console.log(paths);

