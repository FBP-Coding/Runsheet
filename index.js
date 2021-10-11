const NanoTimer = require('nanotimer');
const { readSheet, getAuthUrl, setAuthCode } = require("./spreadsheet");
const { io } = require("./server");
const { window, app } = require("./main")
const db = require('./db');
const { ipcMain } = require('electron')

let sheetData = [];
let currentSlide = 0;
let currentCountdown = 0;

io.on("connection", (socket) => {
	socket.emit("data", sheetData);
	socket.emit("slide", currentSlide);
	socket.emit("countdown", currentCountdown);

	socket.on("updateSlide", slideId => {
		if (!sheetData[slideId]) return;
		currentSlide = slideId;
		io.emit("slide", slideId);
		resetCountdown();
	})
})

async function main() {
	await app.whenReady();

	const timer = new NanoTimer();

	timer.setInterval(() => {
		io.emit("countdown", currentCountdown);
		currentCountdown -= 1;
	}, '', '1s');

	// Run this if it is to only send the countdown every 10 seconds
	// setInterval(()=> {
	// 	io.emit("countdown", currentCountdown);
	// 	// currentCountdown -= 1;
	// }, 10000);
}

/** 
 *	Resets the countdown to the initial value of the current slide
 */
function resetCountdown() {
	const countdownArr = sheetData[currentSlide].duration.split(".");
	currentCountdown = parseInt(countdownArr[0]) * 60 + parseInt(countdownArr[1])
	io.emit("countdown", currentCountdown);
}

ipcMain.on("loaded", async (event, arg) => {
	console.log("loaded");
	try {
		db.getData("/token");
		event.reply("auth", { status: true })
	}
	catch (err) {
		event.reply("auth", { status: false, authUrl: getAuthUrl() });
	}
	const sheetId = db.getData("/sheetId");
	if (sheetId) {
		try {
			const data = await readSheet(sheetId);
			event.reply("data", { status: true, data, sheetId });
			io.emit("data", data);
			sheetData = data;
			resetCountdown();
		}
		catch (err) {
			console.log(err);
			event.reply("data", { status: false, error: "Invalid sheetId", sheetId });
		}
	} else {
		event.reply("data", { status: false, error: "noSheetId", sheetId });
	}
});

ipcMain.on("authCode", async (event, code) => {
	try {
		await setAuthCode(code);
		event.reply("auth", { status: true })
	}
	catch (error) {
		event.reply("auth", { status: false, authUrl: getAuthUrl(), error });
	}
})

ipcMain.on("spreadsheet", async (event, sheetId) => {
	db.push("/sheetId", sheetId);
	try {
		const data = await readSheet(sheetId);
		event.reply("data", { status: true, data, sheetId });
		io.emit("data", data);
		sheetData = data;
		resetCountdown();
	}
	catch (error) {
		event.reply("data", { status: false, error, sheetId });
	}
})

main();