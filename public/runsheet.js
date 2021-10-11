const socket = io();

let events;

socket.on("data", data => {
	console.log(data);
	events = data;
	updateEvents(data)
})

let timer;
let countdown = 0;

socket.on("countdown", newCountdown => {

	// console.log("External", countdown);
	if (timer) {
		clearInterval(timer);
	}
	timer = setInterval(() => {
		countdown -= 1;
		console.log("Own", countdown, Date.now());
		updateCounters();
	}, 1000);
	countdown = newCountdown;
	console.log("External", countdown, Date.now());

	updateCounters();
})

let slideId = 0;

socket.on("slide", id => {
	slideId = id;
	updateCounters();
});

function updateCounters() {
	const events = document.getElementById("events").children;

	for (let i = 0; i < events.length; i++) {
		if (slideId > i) {
			events[i].classList.add("past");
		} else {
			events[i].classList.remove("past");
		}
		if (slideId == i) {
			events[i].classList.add("current");
		} else {
			events[i].classList.remove("current");
		}
		if (slideId < i) {
			events[i].classList.add("future");
		} else {
			events[i].classList.remove("future");
		}

		if (countdown < 0 && slideId == i) {
			events[i].classList.add("over");
		} else {
			events[i].classList.remove("over");
		}
		if (countdown <= 30 && countdown >= 0 && slideId == i) {
			let value = Math.floor(countdown / 30 * 255);
			let hex = value.toString(16);
			if (hex.length < 2) hex = "0"+hex
			console.log(hex);
			events[i].querySelector(".countdown .content").style = `color: #ff${hex}00;`
		} else {
			events[i].querySelector(".countdown .content").style = "";
		}

		if (countdown >= 0) {
			const seconds = countdown % 60;
			const minutes = Math.floor(countdown / 60);

			events[i].querySelector(".countdown .content").innerText = ((minutes < 10 ? "0" + minutes : minutes) + "." + (seconds < 10 ? "0" + seconds : seconds));
		} else {
			const seconds = Math.abs(countdown) % 60;
			const minutes = Math.floor(Math.abs(countdown) / 60);

			events[i].querySelector(".countdown .content").innerText = ("-" + (minutes < 10 ? "0" + minutes : minutes) + "." + (seconds < 10 ? "0" + seconds : seconds));
		}
	}
}

function pickHex(color1, color2, weight) {
    var w1 = weight;
    var w2 = 1 - w1;
    var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
    return rgb;
}

function updateEvents(events) {
	const eventsFrag = document.createDocumentFragment();
	const template = document.getElementById("template")

	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		const div = template.content.cloneNode(true);
		div.querySelector(".startTime .content").innerText = event.startTime ? event.startTime : "";
		div.querySelector(".duration .content").innerText = event.duration ? event.duration : "";
		// div.querySelector(".countdown .content").innerText = event.countdown;
		div.querySelector(".cue .content").innerText = event.cue ? event.cue : "";
		div.querySelector(".location .content").innerText = event.location ? event.location : "";
		div.querySelector(".description .content").innerText = event.description ? event.description : "";
		div.querySelector(".action .content").innerText = event.action ? event.action : "";
		div.querySelector(".audioAction .content").innerText = event.audioAction ? event.audioAction : "";
		div.querySelector(".videoAction .content").innerText = event.videoAction ? event.videoAction : "";

		div.querySelector(".event").addEventListener("click", ()=>{
			console.log(i);
			socket.emit("updateSlide", i);
		})

		eventsFrag.appendChild(div);
	}

	document.getElementById("events").replaceChildren(eventsFrag);
}