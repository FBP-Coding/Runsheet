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
	document.getElementById("events").children[slideId].scrollIntoView({ behavior: "smooth", block: "center" })
});

function updateCounters() {
	const eventElms = document.getElementById("events").children;

	for (let i = 0; i < eventElms.length; i++) {
		if (slideId > i) {
			eventElms[i].classList.add("past");
		} else {
			eventElms[i].classList.remove("past");
		}
		if (slideId == i) {
			eventElms[i].classList.add("current");
		} else {
			eventElms[i].classList.remove("current");
		}
		if (slideId < i) {
			eventElms[i].classList.add("future");
		} else {
			eventElms[i].classList.remove("future");
		}

		if (countdown < 0 && slideId == i) {
			eventElms[i].classList.add("over");
		} else {
			eventElms[i].classList.remove("over");
		}
		if (countdown <= 30 && countdown >= 0 && slideId == i) {
			let value = Math.floor(countdown / 30 * 255);
			let hex = value.toString(16);
			if (hex.length < 2) hex = "0" + hex
			console.log(hex);
			eventElms[i].querySelector(".countdown .content").style = `color: #ff${hex}00;`
		} else {
			eventElms[i].querySelector(".countdown .content").style = "";
		}

		let seconds = Math.abs(countdown) % 60;
		let minutes = Math.floor(Math.abs(countdown) / 60);

		if (slideId > i) continue;

		if (slideId < i) {
			if (countdown > 0) {
				for (let j = slideId + 1; j <= i; j++) {
					const string = events[j].duration;
					const [min, sec] = string.split(".");
					minutes += parseInt(min);
					seconds += parseInt(sec);
					if (seconds > 59) {
						minutes++;
						seconds -= 60
					}
				}
			} else {
				minutes = 0;
				seconds = 0;
				for (let j = slideId + 1; j <= i; j++) {
					const string = events[j].duration;
					const [min, sec] = string.split(".");
					minutes += parseInt(min);
					seconds += parseInt(sec);
				}
			}
		}

		if (countdown >= 0 || slideId < i) {
			eventElms[i].querySelector(".countdown .content").innerText = ((minutes < 10 ? "0" + minutes : minutes) + "." + (seconds < 10 ? "0" + seconds : seconds));
		} else {
			eventElms[i].querySelector(".countdown .content").innerText = ("-" + (minutes < 10 ? "0" + minutes : minutes) + "." + (seconds < 10 ? "0" + seconds : seconds));
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

		div.querySelector(".event").addEventListener("click", () => {
			console.log(i);
			socket.emit("updateSlide", i);
		})

		eventsFrag.appendChild(div);
	}

	document.getElementById("events").replaceChildren(eventsFrag);
}