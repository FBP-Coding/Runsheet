const { ipcRenderer } = require('electron');

ipcRenderer.send('loaded')

const signedInElm = document.getElementById("authenticated");
const notSignedInElm = document.getElementById("notAuthenticated");
const authUrlElm = document.getElementById("authUrl");
const authCodeElm = document.getElementById("authCode");
const authErrorElm = document.getElementById("authError");

authCodeElm.addEventListener("keydown", event => {
	if (event.key == "Enter") {
		event.preventDefault();
		ipcRenderer.send("authCode", event.target.value);
	}
})

ipcRenderer.on("auth", (event, auth) => {
	console.log(auth);
	if (auth.status) {
		signedInElm.style.display = "block";
		notSignedInElm.style.display = "none";
	} else {
		signedInElm.style.display = "none";
		notSignedInElm.style.display = "block";

		// authUrlElm.innerText = auth.authUrl
		authUrlElm.href = auth.authUrl
		if (auth.error) {
			authErrorElm.innerText = auth.error
		} else {
			authErrorElm.innerText = ""
		}
	}
})

const spreadsheetConnectedElm = document.getElementById("spreadsheetConnected");
const spreadsheetMissingElm = document.getElementById("spreadsheetMissing");
const spreadsheetElm = document.getElementById("spreadsheet");
const spreadsheetErrorElm = document.getElementById("spreadsheetError");

spreadsheetElm.addEventListener("keydown", event => {
	if (event.key == "Enter") {
		event.preventDefault();
		ipcRenderer.send("spreadsheet", event.target.value);
	}
})

ipcRenderer.on("data", (event, data) => {
	console.log(data);
	if (data.status) {
		spreadsheetConnectedElm.style.display = "block";
		spreadsheetMissingElm.style.display = "none";
	} else {
		spreadsheetConnectedElm.style.display = "none";
		spreadsheetMissingElm.style.display = "block";
	}

	spreadsheetElm.value = data.sheetId

	if (data.error) {
		spreadsheetErrorElm.innerText = data.error
	} else {
		spreadsheetErrorElm.innerText = ""
	}
})

navigate(localStorage.getItem("menu"));

function navigate(page) {
	localStorage.setItem("menu", page)
	let changed = false;
	const pages = document.getElementsByClassName("content");
	for (let i = 0; i < pages.length; i++) {
		if (i == page) {
			pages[i].classList.remove("hidden")
			changed = true;
		} else {
			pages[i].classList.add("hidden")
		}
	}
	if (!changed) {
		pages[0].classList.remove("hidden")
	}
}

const db = require("../db");
const { obs, connect: obsConnect } = require("../obs");

const obsErrorElm = document.getElementById("obsError");
const portElm = document.getElementById("port");
const obsportElm = document.getElementById("obsport");
const obsipElm = document.getElementById("obsip");
const obsReconnectElm = document.getElementById("obsReconnect");
portElm.value = db.getData("/port");
obsportElm.value = db.getData("/obsport");
obsipElm.value = db.getData("/obsip");
portElm.addEventListener("change", () => {
	db.push("/port", parseInt(portElm.value));
	obsConnect();
	updateOBSStatus();
})
obsportElm.addEventListener("change", () => {
	db.push("/obsport", parseInt(obsportElm.value));
	obsConnect();
	updateOBSStatus();
})
obsipElm.addEventListener("change", () => {
	db.push("/obsip", obsipElm.value);
	obsConnect();
	updateOBSStatus();
})

obs.on("ConnectionOpened", ()=>{
	updateOBSStatus()
})

obs.on("ConnectionClosed", ()=>{
	updateOBSStatus()
})

function updateOBSStatus() {
	if (!obs._connected) {
		console.log("OBS failed");
		obsErrorElm.innerText = "Failed to connect";
	} else {
		obsErrorElm.innerText = "Connected";
	}
}

updateOBSStatus();

obsReconnectElm.addEventListener("click", ()=>{
	obsConnect();
	updateOBSStatus();
})