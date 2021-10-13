function dateFromString(date) {
	const d = new Date();
	const [hours, minutes, seconds] = date.split('.')

	d.setHours(+hours); 
	d.setMinutes(minutes); 
	d.setSeconds(seconds);

	return d;
}

var net = require('net');

var server = net.createServer(function(socket) {
	// socket.write('Echo server\r\n');
	// socket.pipe(socket);
	socket.on("data", (data) => {
		console.log(data+"");
	});
});

server.listen(7000, '127.0.0.1');