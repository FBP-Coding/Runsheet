const NanoTimer = require('nanotimer');
const { readSheet, getAuthUrl, setAuthCode } = require("./spreadsheet");
const { io, createSocket } = require("./server");
const { window, app } = require("./main")
const db = require('./db');
const { ipcMain } = require('electron')
const { obs } = require("./obs");

let sheetData = [];
let currentSlide = 0;
let currentCountdown = 0;

io.on("connection", (socket) => {
	socket.emit("data", sheetData);
	socket.emit("slide", currentSlide);
	socket.emit("countdown", currentCountdown);

	socket.on("updateSlide", async slideId => {
		if (!sheetData[slideId]) return;
		currentSlide = slideId;
		io.emit("slide", slideId);
		resetCountdown();
		// if (sheetData[currentSlide - 1] && sheetData[currentSlide - 1].overlay) {

		// 	try {
		// 		let { scenes } = await obs.send("GetSceneList");
		// 		for (let i = 0; i < scenes.length; i++) {
		// 			await obs.send("SetSceneItemProperties", {
		// 				"scene-name": scenes[i].name,
		// 				item: { name: sheetData[currentSlide - 1].overlay },
		// 				visible: false
		// 			})
		// 		}
		// 	} catch (error) {
		// 		console.log(error);
		// 	}
		// }
		// if (sheetData[currentSlide].overlay) {
		// 	try {
		// 		let { scenes } = await obs.send("GetSceneList");
		// 		for (let i = 0; i < scenes.length; i++) {
		// 			console.log(scenes[i].name);
		// 			await obs.send("SetSceneItemRender", {
		// 				"scene-name": scenes[i].name,
		// 				source: sheetData[currentSlide].overlay,
		// 				render: true
		// 			})
		// 		}
		// 	} catch (error) {
		// 		console.log(error.error);
		// 	}
		// }
	})
})

createSocket(async data => {
	console.log(data);
	if (data.toString() == "overlay") {
		if (sheetData[currentSlide].overlay) {
			try {
				let { scenes } = await obs.send("GetSceneList");
				for (let i = 0; i < scenes.length; i++) {
					console.log(scenes[i].name);
					let source = scenes[i].sources.filter(e => e.name === sheetData[currentSlide].overlay)[0]
					await obs.send("SetSceneItemRender", {
						"scene-name": scenes[i].name,
						source: sheetData[currentSlide].overlay,
						render: !source.render
					})
				}
			} catch (error) {
				console.log(error.error);
			}
		}
	} else if (data.toString() == "nextSlide") {
		if (!sheetData[currentSlide + 1]) return;
		currentSlide++;
		io.emit("slide", currentSlide);
		resetCountdown();
	}
})

async function main() {
	await app.whenReady();

	const timer = new NanoTimer();

	timer.setInterval(() => {
		io.emit("countdown", currentCountdown);

		if (!sheetData[currentSlide]) return;

		if (currentCountdown < 0 && sheetData[currentSlide].specific) {
			currentSlide += 1;
			io.emit("slide", currentSlide);
			resetCountdown();
		}

		currentCountdown -= 1;
	}, '', '1s');

	// Run this if it is to only send the countdown every 10 seconds
	// setInterval(()=> {
	// 	io.emit("countdown", currentCountdown);
	// 	// currentCountdown -= 1;
	// }, 10000);
}

obs.on("SwitchScenes", (scene) => {
	if (!sheetData[currentSlide + 1]) return;
	if (!sheetData[currentSlide + 1].scene) return;
	if (sheetData[currentSlide + 1].scene !== scene["scene-name"]) return;

	currentSlide += 1;
	io.emit("slide", currentSlide);
	resetCountdown();
})

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