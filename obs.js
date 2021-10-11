const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();
obs.connect({ address: 'localhost:4444' });

// TODO: Get the settings from the settings panel in the app

module.exports = { obs }