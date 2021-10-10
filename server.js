const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require("cors")

const path = require('path');
const db = require("./db");

app.use(cors());
app.use(express.static(path.resolve(__dirname, 'public')));

server.listen(db.getData("/port") || 8080, () => {
	console.log('listening on *:' + (db.getData("/port") || 8080));
});

module.exports = { io };