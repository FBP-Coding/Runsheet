const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require("cors")

const net = require('net');

const path = require('path');
const db = require("./db");

let companionSocket;

function createSocket(fn) {
	net.createServer(function (socket) {
		// socket.write('Echo server\r\n');
		// socket.pipe(socket);
		socket.on("data", fn);
	}).listen(7000, '127.0.0.1');
}

app.use(cors());
app.use(express.static(path.resolve(__dirname, 'public')));

server.listen(db.getData("/port") || 8080, () => {
	console.log('listening on *:' + (db.getData("/port") || 8080));
});

module.exports = { io, createSocket };