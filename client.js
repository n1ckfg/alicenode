const WS = require('ws')
const ReconnectingWebSocket = require('reconnecting-webSocket')

 
const options = {
    WebSocket: WS, // custom WebSocket constructor
    connectionTimeout: 1000,
    maxRetries: 10,
};

rwsUrl = 'ws://192.168.5.17/9090'
const rws = new ReconnectingWebSocket(rwsUrl,[], options);
console.log('trying')
rws.addEventListener('open', () => {
    rws.send('hello!');
});

rws.addEventListener('message', (msg) => {
    console.log(msg);
});

rws.addEventListener('error', (error) => {
    console.log(error);
});