const db = require("./db");

const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

function connect() {
	obs.connect({ address: db.getData("/obsip") + ":" + db.getData("/obsport") });
}

connect();

module.exports = { obs, connect }