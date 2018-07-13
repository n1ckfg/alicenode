#!/usr/bin/env node
// const fastcall = require("fastcall")
const express = require('express')
const WebSocket = require('ws')
const mmapfile = require('mmapfile')
const chokidar = require('chokidar')
const pako = require('pako') // zlib compression
const http = require('http')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { exec, execSync, spawn, spawnSync, fork } = require('child_process')
const sortJson = require('sort-json-array');
const options = { ignoreCase: true, reverse: true, depth: 1};
const getType = require('get-type');
const ps = require('ps-node'); // check if a process is running. using it in the function that checks and/or launches the max/msp sonification patch


let alice

function random (low, high) {
  return Math.random() * (high - low) + low
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

/// ///////////////////////////////////////////////////////////////////////////

// CONFIGURATION

const libext = process.platform === 'win32' ? 'dll' : 'dylib'
//serverMode can be set to 'nosim' for client editors testing
const serverMode = process.env.startFlag || process.argv[2]
if (serverMode) {
  console.log("\n\nServer Mode set to '" + serverMode + "'\n\n")
}
// derive project to launch from first argument:
process.chdir('../alicenode_inhabitat')
const projectPath = process.cwd()
const serverPath = __dirname
const clientPath = path.join(serverPath, 'client')
console.log('projectPath', projectPath)
console.log('serverPath', serverPath)
console.log('clientPath', clientPath)

const projectlib = 'project.' + libext

// // remove temporary files:
// removeTempFiles()
// function removeTempFiles () {
//   cardsFileList = fs.readdirSync(serverPath + '/cpp2json/output').filter(function (file) {
//       if (file.includes('.json')) {
//         fs.unlink(serverPath + '/cpp2json/output/' + file, (err) => {
//           if (err) throw err;
//           console.log('/cpp2json/output/' + file + ' was deleted');
//         });
//       }
//     else {
//       return file
//     }
//   })
// }

// refresh the state from the mmap every 10 seconds
//let maxPID; // the process ID for max/msp
// setInterval(function () {

//   ps.lookup({
//     command: 'Max',
//     }, function(err, resultList ) {
//     if (err) {
//         throw new Error( err );
//     }
//     //console.log(resultList)
//     if (resultList.length == 0) {
//       console.log("max not running, launching now")

//       switch (libext) {
//         case "dylib":
//         exec("open -a 'Max' " + projectPath + "/audio/audiostate_sonification.maxpat")

//         break;

//         case "win32":
//         case "dll":
//         exec("start " + projectPath + "/audio/audiostate_sonification.maxpat")

//         break;
//       }
//     } else {
//         resultList.forEach(function( process ){
//           if ( process ){
//             //report max running:
//             console.log( '\nProcess check: Application MaxMSP running on PID: %s, %s', process.pid, process.command);

//           } 
//       }); 
//     }
//   })
//   //console.log('\nupdating mapped state var in server')
//   //getState();
// }, 10000)


// State Editor:
let stateSource
let stateAST
let state = [] // we'll send this to the client
let paramValue;
let unusedParams = []


/// 
// mmap the state
let statebuf
try {
  buffSize = fs.statSync('state.bin').size
  statebuf = mmapfile.openSync('state.bin', buffSize, 'r+')
  console.log('mapped state.bin, size ' + statebuf.byteLength)
  // console.log(Buffer.byteLength(statebuf))
} catch (e) {
  console.error('failed to map the state.bin:', e.message)
}
/*
switch(libext){
  case "win32":
  case "dll":
    exec('./build.bat', {cwd: __dirname + '/cpp2json/'}, (stdout) => {
      console.log("Standard Output: " + stdout);
    });
    break;
  case "dylib":
    exec('./build.sh', {cwd: __dirname + '/cpp2json/'}, (stdout) => {
      console.log("Standard Output: " + stdout);
    });
  default:
    console.log("Your not on any compatable machine.");
    break;
}
*/


getState()
function getState () {

  

  //clear state:
  state = []
  unusedParams = []
  // get sourcecode
  stateSource = fs.readFileSync(path.join(projectPath, '/state.h')).toString()
  stateSource = JSON.stringify(stateSource)

  exec(('./cpp2json ' + path.join(projectPath + '/state.h') + ' output/state.json'), {cwd: __dirname + '/cpp2json/'}, () => {

    stateAST = JSON.parse(fs.readFileSync(path.join(__dirname, '/cpp2json/output/state.json'), 'utf-8'))
    console.log("stateAST Loaded")

    Object.keys(stateAST.nodes).forEach(function (key) {
      if (stateAST.nodes[key].name === 'State') {

        Object.keys(stateAST.nodes[key].nodes).map(function (objectKey, index) {
          value = stateAST.nodes[key].nodes[objectKey]
          paramName = value.name
          begin = value.loc.begin.line
          beginChar = value.loc.begin.char
          beginCol = value.loc.begin.col
          end = value.loc.end.line
          endChar = value.loc.end.char
          endCol = value.loc.end.col
          //console.log(paramName, value.loc)
          type = value.type
          offset = value.offsetof

          if (type.includes('void')) {
              //we ignore 'void' types for now
          } else {
          console.log(paramName, paramValue, type, offset, begin, end, beginChar, beginCol, endChar, endCol)
          // sizeOf = value.sizeof

          // console.log(sizeOf)
          
          // need to write switch based on the type of the node. see nodejs buffer doc see buff.write types (i.e. buff.writeInt32, buff.writeUInt32BE)

            switch (type) {

              case 'float':
                paramValue = statebuf.readFloatLE(offset)
                state.push({paramName, paramValue, type, offset, begin, end, beginChar, beginCol, endChar, endCol})
                break
              case 'int':
              paramValue = statebuf.readIntLE(offset, 4)
              state.push({paramName, paramValue, type, offset, begin, end, beginChar, beginCol, endChar, endCol})
                break
              // case 'glm::vec3':
              //   break
              case 'double':
              paramValue = statebuf.readDoubleLE(offset);
              state.push({paramName, paramValue, type, offset, begin, end, beginChar, beginCol, endChar, endCol})
                break
              // case 'glm::vec4':
              //   break
              case 'DebugDot':

              //console.log(ParamName, paramValue)
                break
              case 'CreaturePart':
                break
              case 'Particle':
                break
              case 'Segment':
                break
              case 'Creature':
                break

              case 'Object':
                paramValue = statebuf.readUInt8(offset)
                state.push({paramName, paramValue, type, offset, begin, end, beginChar, beginCol, endChar, endCol})
                break
              default:
                  //console.log('\nWarning: unknown parameter found in state.bin. please add switch to case "switch (type)": \nname: ' + paramName + '\nvalue: ' + paramValue + '\ntype: ' + type + '\noffset:' + offset)
              }
            }
        })
      }
      // console.log(arg.nodes[key].name)
    })
    //console.log(state)

  })


}

// let port = 8080
// let userName = "Guest"; //temporary: default to guest when using the client app
let gitHash
// let projectCPPVersion // when a version of the project.cpp is requested by a client and placed in the right pane, store it here

let commitMsg = 'client updated project' // default commit message if nothing given?

// if alice is already running from a previous crash, then terminate it
// var terminate = require('terminate')

// const find = require('find-process')

let fileList = [] // list of files in the projectPath
// check if the userlist exists on the server machine, if not, create an empty json file:

if (fs.existsSync(path.join(projectPath, 'userlist.json'))) {
  console.log('found userlist.json')
} else {
  fs.writeFileSync(path.join(projectPath, 'userlist.json'), '{}', 'utf8')
  console.log('created userlist.json on ' + os.hostname())
}

pruneWorktree()
// update the worktree list, if any worktrees had been removed by user, make sure they aren't still tracked by git
function pruneWorktree () {
  exec('git worktree prune', {cwd: projectPath})
}
/// //////////////////////////////////////////////////////////////////////////////

function startAlice() {
//serverMode can be set to 'nosim' so that the simulation won't run. useful for deving any client-server webapps without hogging resources, or when the build is in a failed state. try 'npm start nosim'. note, 'npm start' is default
// if (serverMode !== 'nosim') {
  projectBuild();

// BUILD PROJECT
  function projectBuild () {
    let out = ''
    if (process.platform === 'win32') {
      out = execSync('build.bat "' + serverPath + '"', {stdio: 'inherit'})
    } else {
      out = execSync('sh build.sh "' + serverPath + '"', {stdio: 'inherit'})
    }
    //console.log('built project', out.toString())
  }

  // should we build now?
  if (!fs.existsSync(projectlib) || fs.statSync('project.cpp').mtime > fs.statSync(projectlib).mtime) {
    console.warn('project lib is out of date, rebuilding')
    try {
      projectBuild()
    } catch (e) {
      console.error('ERROR', e.message)
      // do a git commit with a note about it being a failed build.
    }
  }

    // LAUNCH ALICE PROCESS

  if (alice) {
    alice.kill()
  }

  // start up the alice executable:
  alice = spawn(path.join(__dirname, 'alice'), [projectlib], {
    cwd: projectPath
  })

  alice.on('message', function (data) { console.log('msg', data.toString())})
  alice.stdout.pipe(process.stdout)
  alice.stderr.pipe(process.stderr)

  // when it's done, load the new dll back in:
  alice.on('exit', function (code) {
    console.log('alice exit code', code)
    // let node exit when it can:
    process.exitCode = 1 // wasn't working on Windows :-(
    process.exit(code)
  })

  function aliceCommand (command, arg) {
    let msg = command + '?' + arg + '\0'
    console.log('sending alice', msg)
    alice.stdin.write(command + '?' + arg + '\0')
  }
}

startAlice();
//}

/// //////////////////////////////////////////////////////////////////////////////

// UPDATE GIT REPO: do we commit the alicenode_inhabitat repo on startup?

function gitAddAndCommit () {
  try {
    execSync('git add .', {cwd: projectPath}, () => { console.log('git added') })
    execSync('git commit -m \"' + commitMsg + '\"', {cwd: projectPath}, () => { console.log('git committed') })
    execSync('git status', {cwd: projectPath}, (stdout) => { console.log('\n\n\n\n\n\n\n' + stdout) })
  } catch (e) {
    console.error(e.toString())
  }
}


//////////////////////////////////////////////////////////////////////////////

// HTTP SERVER

let sessionId = 0
let sessions = []

const app = express()
app.use(express.static(clientPath))
app.get('/', function (req, res) {
  res.sendFile(path.join(clientPath, 'index.html'))
})
// app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app)

// add a websocket service to the http server:
const wss = new WebSocket.Server({ server })

// send a (string) message to all connected clients:
function sendAllClients (msg) {
  wss.clients.forEach(function each (client) {
    client.send(msg)
  })
}

// whenever a client connects to this websocket:
wss.on('connection', function (ws, req) {
  let perSessionData = {
    id: sessionId++,
    socket: ws

  }
  let fileName // user-selected fileName
  let userName; 


  

  sessions[perSessionData.id] = perSessionData

  console.log('server received a connection, new session ' + perSessionData.id)
  console.log('server has ' + wss.clients.size + ' connected clients')

  // const location = url.parse(req.url, true)
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // /\/\/\/\/\/\/\/\/\/\ Alicenode Main Editor: /\/\/\/\/\/\/\/\/\/\/
  // get the current list of authors involved in the alicenode_inhabitat project
  let userlist = JSON.parse(fs.readFileSync(path.join(projectPath, 'userlist.json'), 'utf8'))

  ws.send('setUserList?' + JSON.stringify(userlist))
  // let currentBranch
  // get the current list of files in the projectPath (less the git meta dirs, worktrees, and tmp)
  fileList = fs.readdirSync(projectPath).filter(function (file) {
    if (file.charAt(0) === '+');
    else if (file.charAt(0) === '.');
    else if (file.includes('userlist.json'));
    else if (file.includes('userWorktree'));
    else if (file.includes('.code-workspace'));
    else if (file.includes('tmp'));
    else if (file.includes('.bin'));
    else if (file.includes('.dll'));
    else if (file.includes('.lib'));
    // to do add filter that makes sure it ignores folders! maybe in the future we'll want to recursively search folders, but for now, folders likely indicate either git meta, worktrees, or tmp.
    else {
      return file
    }
  })
  let userWorktree // the directory that a client's right editor will work in
  ws.send('setFileList?' + JSON.stringify(fileList))

  // get list of branches within repo
  exec('git branch -v', {cwd: projectPath}, (stdout, err, stderr) => {
    ws.send('setBranchList?' + err)
  })

  // /\/\/\/\/\/\/\/\/\/\ Alicenode Cards Editor /\/\/\/\/\/\/\/\/\
  
let deck
let src

// cards functions:
listFiles()
function listFiles () {
  cardsFileList = fs.readdirSync(projectPath).filter(function (file) {
    if (file.charAt(0) === '+');
    else if (file.charAt(0) === '.');
    else if (file.includes('.dylib'));
    else if (file.includes('userlist.json'));
    else if (file.includes('userWorktree'));
    else if (file.includes('.code-workspace'));
    else if (file.includes('tmp'));
    else if (file.includes('.bin'));
    else if (file.includes('.dll'));
    else if (file.includes('.lib'));
    // to do add filter that makes sure it ignores folders! maybe in the future we'll want to recursively search folders, but for now, folders likely indicate either git meta, worktrees, or tmp.
    else {
      return file
    }
  })
}
ws.send('cardsFileList?' + cardsFileList)

// on message receive
  ws.on('message', function (message) {
    let onHash
    let numBranches
    // console.log(message)
    //var userName // this is what the client has signed in as

    if (message.includes('fileRequest')) {
      fileName = message.replace('fileRequest', '')
      // send the content of the file to the client editor
      ws.send('currentVersion?' + fs.readFileSync(fileName, 'utf8'))

      // get all of the commits which contain the file
      exec('git log --all --source --abbrev-commit --pretty="%h | %cr | %cn | %B" -- ' + fileName, {cwd: projectPath}, (stdout, stderr, err) => {
        // console.log(JSON.stringify(stderr))
        let commitList = stderr.split('refs/heads').join('')
        ws.send('branchCommits?' + commitList)
        console.log(commitList)
      })
    }

    if (message.includes('getCurrentBranch')) {
      exec('git rev-parse --abbrev-ref HEAD', { cwd: projectPath }, (stdout, stderr, err) => {
        // console.log("this it sshshs kjdlfj;ldkslfj" + stderr.replace(" string", ""));
        ws.send('branchname?' + stderr.replace('\n', ''))
        // console.log("branchname?" + stderr.replace("\n", ""))
      })
    }

    if (message.includes('editedRightCode')) {
      console.log(message)
      let gitCommand = message.replace('editedRightCode', '')
      console.log(gitCommand)

      // wss.clients.forEach(function each (client) {
      //   client.send('chatMsg?newCommit ' + userName + ' changed ' + fileName + ' on branch ')
      // })

      // sendAllClients(userName + " changed " + fileName + " on branch ")
      // get number of branches in alicenode_inhabitat

      if (libext === 'dylib') {
        // if on unix, do this:
        exec('git branch | wc -l', {cwd: userWorktree}, (stdout, stderr, err) => {
          onHash = message.replace('createNewBranch ', '')
          numBranches = Number(stderr.replace(/\s+/g, ''))
        })
      } else {
        // if on windows, use the "Measure-Object" in place of 'wc' i.e. 'git branch | Measure-Object -line'
        // console.log(userName);

        // console.log(gitCommand.substr(gitCommand.lastIndexOf('_')+1));
        console.log('working on windows machine\nchecked out new branch: ' + gitCommand.substr(0, gitCommand.indexOf('_')))
        exec('git checkout -b ' + gitCommand, {cwd: userWorktree}, (stdout, err, stderr) => {
          console.log('---\ngit: ' + stderr + '\n---')
        })

        // TODO: need to figure this out next.
        /*
    //console.log("worktree is " + arg)
    //clientOrigRightWorktree = message.replace("switchWorktree ", "")
    exec("cd " + clientOrigRightWorktree)
    console.log("Right editor working within " + clientOrigRightWorktree + "'s worktree")
        */
      }

      // +1 to branch count, name the branch
      // if (numBranches > 0) {
      // numBranches = (Number(numBranches) + 1)

      // newBranchName = (numBranches + "_" + clientOrigRightWorktree)

      // exec("git checkout -b " + ((Number(numBranches) + 1) + "_" + clientOrigRightWorktree) + onHash, {cwd: path.join(projectPath, clientOrigRightWorktree)}, (stdout) => {

      // ws.send("Switched to branch " + ((Number(numBranches) + 1) + "_" + clientOrigRightWorktree) + " starting from commit " + onHash)

      // })
    }

    // create a new branch under a new worktree. worktree saved at ../alicenode_inhabitat/<onHash>
    // exec("git worktree add --checkout -b " + newBranchName + " " + onHash , (stdout, stderr, err) => {

    // //change to new worktree directory
    // exec("cd " + (message.replace("createNewBranch ", "")), () => {

    // //console.log(projectCPPVersion)
    // fs.writeFileSync(message.replace("createNewBranch ", "") + "/project.cpp", projectCPPVersion, "utf8");

    // //inform client
    // ws.send("Switched to branch " + newBranchName + " starting from commit " + onHash)

    // })
    // })

    // }
    // else {
    // //if numBranches = 1
    // newBranchName = ("playBranch_1 ")

    // execSync("git worktree add --checkout -b " + newBranchName + " " + onHash, (stdout, stderr, err) => {
    // })
    // //change to new worktree directory
    // execSync("cd " + onHash, () => {

    // //inform client
    // ws.send("three cheers for playfulness! Working from new branch " + newBranchName + " starting from commit " + onHash)

    // })
    // }
    // })
    // }

    // //TODO:

    // //then update merge.html session with current branch name & reload the svg file
    // }

    if (message.includes('git show')) {
      // if a fileName has been selected
      console.log("\n\n\n\n" + message)
      console.log(fileName)
      if (fileName) {
        // path.join("..", "alicenode_inhabitat/project.cpp")
        exec(message + ':' + fileName, { cwd: projectPath }, (stdout, stderr, err) => {
          console.log("stdout" + stdout)
          console.log("stderr" + stderr)
          console.log("err" + err)
          ws.send('show?' + stderr)

          console.log('sending show ' + stdout)
          // console.log(stdout);
          // console.log(projectCPPVersion);
        })
      }
      // this is run when a client connects. its a bit of a lgeacy feature left over from the earliest version of the client-server.
      else {
        var gitCommand = (gitHash + ':' + fileName)
        // var gitHash = message.replace("git show ", "")
        console.log('githash = ' + gitHash)

        // path.join("..", "alicenode_inhabitat/project.cpp")
        exec(gitCommand, { cwd: projectPath }, (stdout) => {
          ws.send('show?' + stdout)

          console.log('sending show')
          // console.log(stdout);
          // console.log(projectCPPVersion);

          // console.log(gitCommand);
        })
      }
    }

    let q = message.indexOf('?')
    if (q > 0) {
      let cmd = message.substring(0, q)
      let arg = message.substring(q + 1)
      switch (cmd) {
        // case "newUser":
        // console.log(arg)
        // break;

        // CLIENT: ///////////////////////////////////////////////////////

        case 'chatMsg':
          console.log(arg)
          wss.clients.forEach(function each (client) {
            let dateStamp = (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds())
            client.send('chatMsg? ' + dateStamp + ' ' + userName + ': ' + arg)
          })

          break

          // git checkout Michael_Palumbo_ac107e5_1527003819750

          // Add user

        case 'newUser':
          // var userlist = [];
          userName = arg.substr(0, arg.indexOf('$?$'))
          let useremail = arg.split('$?$')[1]
          userWorktree = projectPath + path.join('/+' + userName.split(' ').join('_'))
          // whenever a worktree is created, a branch is named after it too. we won't use this branch, but we do need to delete it before we can add a new worktree.
          // execSync('git branch -d +' + userName.split(' ').join('_'))
          let userlist = JSON.parse(fs.readFileSync(path.join(projectPath, 'userlist.json'), 'utf8'))
          userlist[userName] = useremail

          var jsonstring = (JSON.stringify(userlist))
          console.log('user:' + jsonstring)

          fs.writeFileSync(path.join(projectPath, 'userlist.json'), jsonstring, 'utf8')

          // get current branch:
          // exec("git rev-parse ")
          // create a worktree under this user?
          // first replace all spaces with underscores:

          // add a new worktree to alicenode_inhabitat
          // the '+' symbol at the beginning will help us remember
          // that dir is a worktree, and gitignore will catch it
          exec('git worktree add --checkout +' + userName.split(' ').join('_'), (stdout, err, stderr) => {
          })

          // getWorktreeList();

          // TODO: make sure that whenever a username is either added or chosen, that all commits from sendLeftCode are committed with this username and email

          break

          // Select user
        case 'selectUser':
          // have userlist ready
          userEntry = JSON.parse(fs.readFileSync(path.join(projectPath, 'userlist.json'), 'utf8'))
          // client's git username
          userName = arg

          //console.log(arg)
          // client's git email
          userEmail = userEntry[arg]
          userWorktree = projectPath + path.join('/+' + userName.split(' ').join('_'))

          ws.send("chatMsg?'Right Editor' set to work within worktree: " + userWorktree)

          if (fs.existsSync(userWorktree)) {
            console.log('\n---\nClient Session ' + perSessionData.id + ": rightEditor working from worktree '" + userWorktree + "'\n---")
          }
          break

        case 'currentBranch':
          // console.log("\n\n\n\n\n" + userWorktree)
          exec('git checkout ' + arg, {cwd: userWorktree}, (stdout, stderr, err) => {
            console.log(err)

            // once the userWorktree is pointed at a branch, retrieve all files on the branch and send to client
            fileList = fs.readdirSync(userWorktree).filter(function (file) {
              if (file.charAt(0) === '+');
              else if (file.charAt(0) === '.');
              else if (file.includes('userlist.json'));
              else if (file.includes('userWorktree'));
              else if (file.includes('.code-workspace'));
              else if (file.includes('tmp'));
              else if (file.includes('.bin'));
              else if (file.includes('.dll'));
              else if (file.includes('.lib'));
              // to do add filter that makes sure it ignores folders! maybe in the future we'll want to recursively search folders, but for now, folders likely indicate either git meta, worktrees, or tmp.
              else {
                return file
              }
            })

            ws.send('setFileList?' + JSON.stringify(fileList))
          })
          break

          // currentBranch = arg
          // console.log(currentBranch)
          // ws.send(currentBranch)

          // break;
          // Build gitgraph and send to client
        case 'client_SVG':

          /// // PLO //// Could be useful to see what commands are most used, maybe for
          // future features https://github.com/jvns/git-workflow

          // problem in the client script when using the "--follow project.cpp" flag, so its
          // been removed for now, but will make using the browser version difficult, unless you can expose the filenames
          // into the svg. so mouseover tells you which filenames are affected?
          // let alice = spawn('git log --all --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%cN|%s%b|" --stat'), { cwd: projectPath }, (stderr) => {

          // });

          exec('git log --all --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%aN|%s%b|" --stat > ' + path.join(__dirname, '/tmp/gitlog.txt'), {cwd: projectPath}, (stdout, stderr, err) => {
            // exec buffer size is smaller than our current worktree output, so save it to text file and re-read it.
            fs.readFile(path.join(__dirname, '/tmp/gitlog.txt'), 'utf8', function (err, data) {
              if (err) throw err
              let gitlog = data

              // on the server
              // given the text of a gitlog output, it will produce a JSON-friendly object representation of it
              // which can be used to render on a client
              function makeGraphFromGitlog (gitlog) {
                // this will collect an object for each commit:
                let commits = []
                // this will collect the names of commits with no parent:
                let roots = []
                // the biggest column used so far
                // this is used to compute a commit's column position
                let maxcolumn = 1
                // build a lookup-table from hash name to commit object:
                let commit_map = {}
                // keep a cache of what child names have been mentioned so far
                // (this will identify any "root" commits)
                let forward_refs = {}
                // pull out each line of the source log:
                let lines = gitlog.split(')\n')
                for (let i = 0; i < lines.length; i++) {
                  // get each bar-separated term of the line in an array
                  let line = lines[i].split('|')
                  // the first item is the hash commit
                  let hash = line[0]
                  if (hash.length) { // skip empty lines
                    // create an object representation of the commit
                    let commit = {
                      hash: hash,
                      // an array of hashes of this commit's children
                      children: line[1] ? line[1].split(' ') : [],
                      // an array of terms of the commit's refs
                      ref: line[2] ? line[2].split(', ') : [],
                      // the row is determined by the line number
                      row: i + 1,
                      // the column is initially undetermined (it will be changed later)
                      col: 0,

                      // TODO: add these in. for now they are causing half the commits in the
                      // log to be ignored

                      // the date the commit was made
                      commit_date: line[3] ? line[3].split(', ') : [],
                      // who made the commit?
                      committer_name: line[4] ? line[4].split(', ') : [],
                      // commit's message
                      commit_msg: line[5] ? line[5].split(', ') : [],
                      // list the files and change stats associated with each commit
                      commit_files: line[6] ? line.slice(6) : []
                    }
                    // if this commit hasn't been encountered as a child yet,
                    // it must have no parent in the graph:
                    if (!forward_refs[hash]) {
                      roots.push(hash)
                      // mark this commit as parent-less
                      // not sure if this is really needed
                      commit.root = true
                    }

                    // add to the list of commits
                    commits.push(commit)
                    // add to the reverse-lookup by name
                    commit_map[hash] = commit

                    // also note the forward-referencing of each child
                    // (so we can know if a future commit has a parent or not)
                    for (let c of commit.children) {
                      forward_refs[c] = true
                    }
                  }
                }

                // depth first traversal
                // to assign columns to each commit
                // and also generate the paths as we go

                // we'll start with a list of all the commits without parents:
                // (using a map() to convert hash names into the full object references)
                let stack = roots.map(function (hash) { return commit_map[hash] }).reverse()
                // we need a cache to remember which items we have visited
                let visited = {}

                // the result will populate a list of objects representing the paths between commits:
                let paths = []

                // consume each item on our "todo" stack, until there are none left:
                while (stack.length > 0) {
                  // remove top item from stack
                  let commit = stack.pop()
                  // note that we have now visited this
                  // (so we don't process a commit twice by mistake)
                  visited[commit.hash] = true

                  // if the commit doesn't have a column assigned yet, it must be a root
                  if (!commit.col) {
                    // create a new empty column for it:
                    commit.col = maxcolumn++
                  } else {
                    // make sure we have widened our maxcolumn to accommodate this commit
                    maxcolumn = Math.max(maxcolumn, commit.col)
                  }

                  // for each child:
                  for (let i = commit.children.length - 1; i >= 0; i--) {
                    let child_hash = commit.children[i]
                    // get the actual child object this hash refers to
                    let child = commit_map[commit.children[i]]
                    if (child) { // skip if the child commit is not in our source
                      // if we haven't visited this child yet,
                      if (!visited[child_hash]) {
                        // assign it a new column, relative to parent
                        child.col = commit.col + i
                        // and add it to our "todo" stack:
                        stack.push(child)
                      }
                      // add an object representation of this path:
                      paths.push({
                        from: commit.hash,
                        to: child.hash
                      })
                    }
                  }
                }
                // return a full representation of the graph:
                return {
                  maxcolumn: maxcolumn,
                  roots: roots,
                  commits: commits,
                  paths: paths
                }
              }

              let graph = makeGraphFromGitlog(gitlog)
              let graphjson = pako.deflate(JSON.stringify(graph), {to: 'string'})
              // commenting this out for now because gitignore is not working...?
              // fs.writeFileSync(path.join(clientPath, "gitgraph.json"), JSON.stringify(graph, null, 2), 'utf8');
              // send graph as json to client
              ws.send('gitLog?' + graphjson)
            })
          })
          break

        case 'editRight':

        // console.log(arg)
          // get the commit message provided by the client
          commitMsg = arg.substring(arg.lastIndexOf('?commit') + 1, arg.lastIndexOf('?code')).replace('commit', '')
          // get the code
          newCode = arg.split('?code')[1]

          thisAuthor = (arg.substring(arg.lastIndexOf('?author') + 1, arg.lastIndexOf('?commit')).replace('author', ''))

          fs.writeFileSync(userWorktree + '/' + fileName, newCode, 'utf8')
          // git add and commit the new changes, including commitMsg
          execSync('git add .', {cwd: userWorktree }, () => { console.log('git added') })
          execSync('git commit --author=\"' + thisAuthor + '\" -m \"' + commitMsg + '\"', {cwd: userWorktree }, () => { console.log('git committed') })
          execSync('git status', {cwd: userWorktree }, (stdout) => { console.log('\ngit status: \n' + stdout) })

        break
          // Client sent code from the left editor. write changes and commit using the name and email provided by the client.
        case 'edit':
          // console.log(arg)
          // get the commit message provided by the client
          let commitMsg = arg.substring(arg.lastIndexOf('?commit') + 1, arg.lastIndexOf('?code')).replace('commit', '')
          // get the code
          let newCode = arg.split('?code')[1]

          let thisAuthor = (arg.substring(arg.lastIndexOf('?author') + 1, arg.lastIndexOf('?commit')).replace('author', ''))

          // console.log(thisAuthor)
          // console.log(arg)

          // let thisUserEmail = (arg.substring(arg.lastIndexOf("?email")+1,arg.lastIndexOf("?commit")).replace("email", ""))
          // console.log(thisAuthor)

          fs.writeFileSync(projectPath + '/' + fileName, newCode, 'utf8')
          // git add and commit the new changes, including commitMsg
          execSync('git add .', {cwd: projectPath }, () => { console.log('git added') })
          execSync('git commit --author=\"' + thisAuthor + '\" -m \"' + commitMsg + '\"', {cwd: projectPath }, () => { console.log('git committed') })
          execSync('git status', {cwd: projectPath }, (stdout) => { console.log('\ngit status: \n' + stdout) })

          exec('git log --all --ignore-missing --full-history --reflog --topo-order --date=short --pretty="%h|%p|%d|%cd|%cN|%s%b|" --stat > ' + path.join(__dirname, '/tmp/gitlog.txt'), {cwd: projectPath}, (stdout, stderr, err) => {
            // exec buffer size is smaller than our current worktree output, so save it to text file and re-read it.
            fs.readFile(path.join(__dirname, '/tmp/gitlog.txt'), 'utf8', function (err, data) {
              if (err) throw err
              let gitlog = data

              // on the server
              // given the text of a gitlog output, it will produce a JSON-friendly object representation of it
              // which can be used to render on a client
              function makeGraphFromGitlog (gitlog) {
                // this will collect an object for each commit:
                let commits = []
                // this will collect the names of commits with no parent:
                let roots = []
                // the biggest column used so far
                // this is used to compute a commit's column position
                let maxcolumn = 1
                // build a lookup-table from hash name to commit object:
                let commit_map = {}
                // keep a cache of what child names have been mentioned so far
                // (this will identify any "root" commits)
                let forward_refs = {}
                // pull out each line of the source log:
                let lines = gitlog.split(')\n')
                for (let i = 0; i < lines.length; i++) {
                  // get each bar-separated term of the line in an array
                  let line = lines[i].split('|')
                  // the first item is the hash commit
                  let hash = line[0]
                  if (hash.length) { // skip empty lines
                    // create an object representation of the commit
                    let commit = {
                      hash: hash,
                      // an array of hashes of this commit's children
                      children: line[1] ? line[1].split(' ') : [],
                      // an array of terms of the commit's refs
                      ref: line[2] ? line[2].split(', ') : [],
                      // the row is determined by the line number
                      row: i + 1,
                      // the column is initially undetermined (it will be changed later)
                      col: 0,

                      // TODO: add these in. for now they are causing half the commits in the
                      // log to be ignored

                      // the date the commit was made
                      commit_date: line[3] ? line[3].split(', ') : [],
                      // who made the commit?
                      committer_name: line[4] ? line[4].split(', ') : [],
                      // commit's message
                      commit_msg: line[5] ? line[5].split(', ') : [],
                      // list the files and change stats associated with each commit
                      commit_files: line[6] ? line.slice(6) : []
                    }
                    // if this commit hasn't been encountered as a child yet,
                    // it must have no parent in the graph:
                    if (!forward_refs[hash]) {
                      roots.push(hash)
                      // mark this commit as parent-less
                      // not sure if this is really needed
                      commit.root = true
                    }

                    // add to the list of commits
                    commits.push(commit)
                    // add to the reverse-lookup by name
                    commit_map[hash] = commit

                    // also note the forward-referencing of each child
                    // (so we can know if a future commit has a parent or not)
                    for (let c of commit.children) {
                      forward_refs[c] = true
                    }
                  }
                }

                // depth first traversal
                // to assign columns to each commit
                // and also generate the paths as we go

                // we'll start with a list of all the commits without parents:
                // (using a map() to convert hash names into the full object references)
                let stack = roots.map(function (hash) { return commit_map[hash] }).reverse()
                // we need a cache to remember which items we have visited
                let visited = {}

                // the result will populate a list of objects representing the paths between commits:
                let paths = []

                // consume each item on our "todo" stack, until there are none left:
                while (stack.length > 0) {
                  // remove top item from stack
                  let commit = stack.pop()
                  // note that we have now visited this
                  // (so we don't process a commit twice by mistake)
                  visited[commit.hash] = true

                  // if the commit doesn't have a column assigned yet, it must be a root
                  if (!commit.col) {
                    // create a new empty column for it:
                    commit.col = maxcolumn++
                  } else {
                    // make sure we have widened our maxcolumn to accommodate this commit
                    maxcolumn = Math.max(maxcolumn, commit.col)
                  }

                  // for each child:
                  for (let i = commit.children.length - 1; i >= 0; i--) {
                    let child_hash = commit.children[i]
                    // get the actual child object this hash refers to
                    let child = commit_map[commit.children[i]]
                    if (child) { // skip if the child commit is not in our source
                      // if we haven't visited this child yet,
                      if (!visited[child_hash]) {
                        // assign it a new column, relative to parent
                        child.col = commit.col + i
                        // and add it to our "todo" stack:
                        stack.push(child)
                      }
                      // add an object representation of this path:
                      paths.push({
                        from: commit.hash,
                        to: child.hash
                      })
                    }
                  }
                }
                // return a full representation of the graph:
                return {
                  maxcolumn: maxcolumn,
                  roots: roots,
                  commits: commits,
                  paths: paths
                }
              }

              let graph = makeGraphFromGitlog(gitlog)
              let graphjson = pako.deflate(JSON.stringify(graph), {to: 'string'})

              // send graph as json to client
              ws.send('gitLog?' + graphjson)
            })
          })

          break



// /\/\/\/\/\/\/\/\/\/\ Alicenode Cards Editor /\/\/\/\/\/\/\/\/\
          case 'cardsFileRequest':

          filename = arg
          filepath = path.join(projectPath, '/', filename)

          src = fs.readFileSync(filepath, 'utf8')
          exec('./cpp2json ' + filepath + ' output/' + filename + '.json', {cwd: path.join(__dirname, '/cpp2json')}, () => {


            deck = fs.readFileSync(path.join(__dirname, '/cpp2json/output/', filename + '.json'), 'utf-8')

            ws.send('deck?' + deck)
            ws.send('src?' + src)
            console.log("\nA cards editor has opened " + filename + "\n")
          })

          break

          

// /\/\/\/\/\/\/\/\/\/\ Alicenode State Editor /\/\/\/\/\/\/\/\/\

          case "stateEditorConnect":

          // NOTE: for now (maybe) the getState Function will exist outside this scope, at global-level. 
          // Send the state when a state editor connects
              state = sortJson(state, 'paramName', 'asc')
              ws.send('state?' + JSON.stringify(state))
              //console.log(state)
              ws.send('state.h?' + stateSource) 

              // console.log(state)

            break
            
          case 'stateUpdate':
            // stateUpdate = JSON.stringify(arg)
            // console.log(arg)
            // console.log(state)
            let stateName = arg.substr(0, arg.indexOf(' '))
            let stateValue = arg.substr(arg.indexOf(' ') + 1)
            // console.log(theName, theValue)
            console.log(arg)
            function findObj (result) {
              return result.paramName === stateName
            }

            let thisObj = state.find(findObj)
            // console.log(thisObj.offset)

            statebuf.writeFloatLE(stateValue, thisObj.offset)

            break

          case 'state.h_write':
            newStateH = JSON.parse(arg)
            //commitMsg = newStateH.commitMsg
            //stateAuthor = newStateH.authorName
            // maybe don't need the email for now
            // commitEmail = newStateH.authorEmail

            // get the code
            //newCode = newStateH.newState

            fs.writeFileSync(projectPath + '/state.h', newStateH.newState, 'utf8')
            // git add and commit the new changes, including commitMsg
            execSync('git add .', {cwd: projectPath }, () => { console.log('\n\n\n\ngit added') })
            // execSync('git commit -m \"' + newStateH.commitMsg + '\"', {cwd: projectPath }, () => { 
            //   console.log('git committed') 
            // })
            // execSync('git status', {cwd: projectPath }, (stdout) => { console.log('\ngit status: \n' + stdout) })
              
            break

        default:
          console.log('unknown cmd', cmd, 'arg', arg)
      }
    } else {
      // console.log("message", message, typeof message);
    }
  })

  ws.on('error', function (e) {
    if (e.message === 'read ECONNRESET') {
      // ignore this, client will still emit close event
    } else {
      console.error('websocket error: ', e.message)
    }
  })

  // what to do if client disconnects?
  ws.on('close', function (connection) {
    console.log('client connection closed')

    delete sessions[perSessionData.id]

    // tell git-in-vr to push the atomic commits?
  })
})

server.listen(8080, function () {
  console.log('server listening on %d', server.address().port)
})

// setInterval(function () {
//   // if (statebuf) sendAllClients(statebuf);
//   // sendAllClients("fps?"+);
// }, 100)

/// //////////////////////////////////////////////////////////////////////////////

// SIM LOADER

function loadsim () {
  // TODO: find a better way to IPC commands:
  aliceCommand('openlib', projectlib)
}

function unloadsim () {
  // TODO: find a better way to IPC commands:
  aliceCommand('closelib', projectlib)
}

// loadsim();

/// //////////////////////////////////////////////////////////////////////////////

// EDIT WATCHER

// would be better to be able to use a dependency tracer,
// so that any file that sim.cpp depends on also triggers.

let watcher = chokidar.watch(projectPath, {ignored: projectPath + '/.git' || projectPath + '+\*'})

watcher
  .on('error', error => console.log(`Watcher error: ${error}`))
  .on('change', (filepath, stats) => {
    // console.log("changed", filepath);
    switch (path.extname(filepath)) {
      // case '.h':
      case '.cpp':
        // first, reload & rebuild sim:
        try {
          // let clients know the sources have changed
          sendAllClients('edit?' + fs.readFileSync('project.cpp', 'utf8'))

          // gitAddAndCommit();

          startAlice();
          
        } catch (e) {
          console.error(e.message)
        }

        // then, commit to git:
        // gitAddAndCommit();
        break
      default: {
        // console.log(`File ${filepath} has been changed`);
      }
    }
  })

/// ////////////////////////////////////////////////////////////





