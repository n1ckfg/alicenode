#!/usr/bin/env node


// launch this when an alice-related process (kinect, steam, etc), fails, and alice wants resiliency to reload them.
var ws = require('websocket').client;
 
var client = new ws();

//when this relay connects with resiliency.js, send the script argument to resiliency.
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected')
    connection.send("relay " + process.argv[2]);
    //exit this script    
    return process.exit(22);
});
 
client.connect('ws://localhost:8080/', 'echo-protocol');