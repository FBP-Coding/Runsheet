function dateFromString(date) {
	const d = new Date();
	const [hours, minutes, seconds] = date.split('.')

	d.setHours(+hours); 
	d.setMinutes(minutes); 
	d.setSeconds(seconds);

	return d;
}

function fromArrayToObject(array) {
	const data
}