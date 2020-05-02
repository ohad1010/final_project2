var https = require('https');
var express = require('express');
var app = express();
var serv = require('http').Server(app);

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    console.log("hey");
})