const { exec, execSync, spawn, spawnSync, fork } = require('child_process')
const fs = require('fs')
const path = require('path')
const mmapfile = require('mmapfile')
const Reader = require('buffer-read')
const { StringDecoder } = require('string_decoder')
var toArrayBuffer = require('to-arraybuffer')

const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const chokidar = require('chokidar')
const url = require('url')

// derive project to launch from first argument:
process.chdir(process.argv[2] || path.join('../..', 'alicenode_inhabitat'))
const projectPath = process.cwd()
console.log(projectPath)
const server_path = __dirname
const client_path = path.join(server_path, 'client')

let deck
let src
let errors
let filename

// cards functions:
listFiles()
function listFiles () {
  fileList = fs.readdirSync(projectPath).filter(function (file) {
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

// console.log(src)

// get the updated json of test.h (see ./cards/cpp2json)
// console.log( __dirname + "/cpp2json/")

let stateSource
let stateAST
let state = [] // we'll send this to the client

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

let statebuf
try {
  buffSize = fs.statSync('state.bin').size
  statebuf = mmapfile.openSync('state.bin', buffSize, 'r+')
  console.log('mapped state.bin, size ' + statebuf.byteLength)
} catch (e) {
  console.error('failed to map the state.bin:', e.message)
}

getState()

function getState () {
  // get sourcecode
  stateSource = fs.readFileSync(path.join(__dirname, '/cpp2json/state.h')).toString()
  stateSource = JSON.stringify(stateSource)

  exec('./cpp2json ' + path.join(projectPath + '/state.h') + ' state.json', {cwd: path.join(__dirname, '/cpp2json')}, () => {
    console.log('state.h traversed')

    stateAST = JSON.parse(fs.readFileSync(path.join(__dirname, '/cpp2json/', 'state.json'), 'utf-8'))

    Object.keys(stateAST.nodes).forEach(function (key) {
      if (stateAST.nodes[key].name === 'State') {
        // console.log(arg.nodes[key].nodes)

        Object.keys(stateAST.nodes[key].nodes).map(function (objectKey, index) {
          let value = stateAST.nodes[key].nodes[objectKey]
          paramName = value.name

          let type = value.type
          let offset = value.offsetof

          // need to write switch based on the type of the node. see nodejs buffer doc see buff.write types (i.e. buff.writeInt32, buff.writeUInt32BE)
          switch (type) {
            case 'float':
              // let obj = new Object;
              let paramValue = statebuf.readFloatLE(offset)

              // let objArray = [paramValue, type, offset]
              // obj[paramName] = objArray

              // console.log(obj);
              state.push({paramName, paramValue, type, offset})

              // console.log("float detected " + paramName, paramValue)
              break

            default:
              state.push({paramName, type})
          }
        })
      }
      // console.log(arg.nodes[key].name)
    })
  })
}
/// /////////////////////HTTP SERVER////////////////////////

let sessionId = 0
let sessions = []

const app = express()
app.use(express.static(client_path))
app.get('/', function (req, res) {
  res.sendFile(path.join(client_path, 'index.html'))
})
// app.get('*', function(req, res) { console.log(req); });
const server = http.createServer(app)

// add a websocket service to the http server:
const wss = new WebSocket.Server({ server })

// send a (string) message to all connected clients:
function send_all_clients (msg) {
  wss.clients.forEach(function each (client) {
    client.send(msg)
  })
}

// whenever a client connects to this websocket:
wss.on('connection', function (ws, req) {
  let per_session_data = {
    id: sessionId++,
    socket: ws

  }
  ws.send('fileList?' + fileList)
  // console.log(deck)

  // if the ast parser produced any warnings/errors:
  if (errors !== undefined) {
    ws.send('serverWarnings?' + errors)
  }

  ws.send('state?' + JSON.stringify(state))
  ws.send('state.h?' + stateSource)

  sessions[per_session_data.id] = per_session_data

  console.log('server received a connection, new session ' + per_session_data.id)
  console.log('server has ' + wss.clients.size + ' connected clients')

  const location = url.parse(req.url, true)
  // TODO:
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  // respond to any messages from the client:
  ws.on('message', function (message) {
    let q = message.indexOf('?')
    if (q > 0) {
      let cmd = message.substring(0, q)
      let arg = message.substring(q + 1)
      switch (cmd) {
        case 'stateUpdate':
          // stateUpdate = JSON.stringify(arg)
          // console.log(arg)
          // console.log(state)
          let theName = arg.substr(0, arg.indexOf(' '))
          let theValue = arg.substr(arg.indexOf(' ') + 1)
          // console.log(theName, theValue)

          function findObj (result) {
            return result.paramName === theName
          }

          let thisObj = state.find(findObj)
          // console.log(thisObj.offset)

          statebuf.writeFloatLE(theValue, thisObj.offset)

          break

        case 'cardsFileRequest':

          // getCpp2json(arg)
          filename = arg
          filepath = path.join(projectPath, '/', filename)

          src = fs.readFileSync(filepath, 'utf8')
          exec('./cpp2json ' + filepath + ' ' + filename + '.json', {cwd: path.join(__dirname, '/cpp2json')}, () => {
            console.log(filename + ' traversed')

            deck = fs.readFileSync(path.join(__dirname, '/cpp2json/', filename + '.json'), 'utf-8')

            ws.send('deck?' + deck)
            ws.send('src?' + src)
          })

          break
        case 'newUser':

          break
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

    delete sessions[per_session_data.id]

    // tell git-in-vr to push the atomic commits?
  })
})

server.listen(8080, function () {
  console.log('server listening on %d', server.address().port)
})

setInterval(function () {
// if (statebuf) send_all_clients(statebuf);
// send_all_clients("fps?"+);
}, 100)
