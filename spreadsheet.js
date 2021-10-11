const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const db = require('./db');

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getNewTokenOld(oAuth2Client) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const question = util.promisify(rl.question).bind(rl);

	const code = await question('Enter the code from that page here: ');
	console.log(rl.close());
	let token;
	try {
		token = await oAuth2Client.getToken(code);
	}
	catch (err) {
		throw ('Error while trying to retrieve access token', err);
	}
	console.log(token.tokens);
	oAuth2Client.setCredentials(token.tokens);
	db.push("/token", token.tokens);
}

function getAuthUrl() {
	const credentials = db.getData("/credentials");
	if (!credentials.installed) {
		throw ("No credentials found")
	}
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	return authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});

}

async function setAuthCode(code) {
	const credentials = db.getData("/credentials");
	if (!credentials.installed) {
		throw ("No credentials found")
	}
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	let token;
	try {
		token = await oAuth2Client.getToken(code);
	}
	catch (err) {
		throw ('Error while trying to retrieve access token');
	}
	oAuth2Client.setCredentials(token.tokens);
	db.push("/token", token.tokens);
}

/**
 * Returns A1:E from the spreadsheet
 * @param {sheets_v4.Params$Resource$Spreadsheets$Values$Get.spreadsheetId} id The spreadsheet to get the data from
 */
async function readSheet(id) {
	const credentials = db.getData("/credentials");
	if (!credentials.installed) {
		throw ("No credentials found")
	}
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	const token = db.getData("/token");
	oAuth2Client.setCredentials(token);

	try {
		const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
		const res = await sheets.spreadsheets.values.get({
			spreadsheetId: id,
			range: 'A2:H',
		});

		const rows = res.data.values;

		const data = rows.map((event) => {
			return {
				startTime: 		event[0],
				duration: 		event[1],
				cue: 			event[2],
				description: 	event[3],
				location: 		event[4],
				action: 		event[5],
				videoAction: 	event[6],
				audioAction: 	event[7],
			}
		})

		return data;
	}
	catch (err) {
		if (err.code==403)
			throw ('No access')
		else
			throw ('Invalid sheetId');

	}

}

module.exports = { readSheet, getAuthUrl, setAuthCode }