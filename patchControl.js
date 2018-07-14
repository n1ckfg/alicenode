#!/usr/bin/env node


// launch this when an alice-related process (kinect, steam, etc), fails, and alice wants resiliency to reload them.
var ws = require('websocket').client;
 
var client = new ws();
 
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');

    
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});
 
client.connect('ws://localhost:8080/', 'echo-protocol');