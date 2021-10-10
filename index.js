const { readSheet, getAuthUrl, setAuthCode } = require("./spreadsheet");
const { io } = require("./server");
const { window } = require("./main")
const db = require('./db');
const { ipcMain } = require('electron')

async function main() {

	setInterval(()=> {
		io.emit("now", new Date());
	}, 250);

	const x = {
		currentSlide: 1,
		countDown: 120
	}

	//TODO: Own counter

}

ipcMain.on("loaded", async (event, arg) => {
	console.log("loaded");
	try {
		db.getData("/token");
		event.reply("auth", { status: true })
	}
	catch (err) {
		console.log(err);
		event.reply("auth", { status: false, authUrl: getAuthUrl() });
	}
	const sheetId = db.getData("/sheetId");
	if (sheetId) {
		try {
			const data = await readSheet(sheetId);
			event.reply("data", { status: true, data, sheetId });
		}
		catch (err) {
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
	}
	catch (error) {
		event.reply("data", { status: false, error, sheetId });
	}
})

main();