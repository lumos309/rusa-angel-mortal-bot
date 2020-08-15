/*
A chatbot by lumos309
 */

'use strict';

const cookies = require("browser-cookies");
const request = require("request-promise");

const telegramBot = require('node-telegram-bot-api');
const express = require('express');
const structjson = require('./structjson.js'); // for error handling in context parsing
const constants = require('./constants.js'); // import pre-defined constants
const tokens = require("./tokens.js"); // import Telegram bot API tokens
const functions = require('./functions.js'); // import helper functions
const admin = require("firebase-admin"); // firebase admin sdk
const serviceAccount = require("./rusa-angel-mortal-bot-firebase-adminsdk-gxxiy-4693a4f5d5.json"); // firebase credentials
const dialogflow = require('dialogflow');
const uuid = require('uuid');

const aboutMessage = constants.aboutMessage;
const helpMessage = constants.helpMessage;
const startMessage = constants.startMessage;
const verifyAdminMessage = constants.verifyAdminMessage;
const pairingNotFoundMessage = constants.pairingNotFoundMessage;
const messageSentMessage = constants.messageSentMessage;

const genderSelectKeyboard = constants.genderSelectKeyboard;
const zoneSelectKeyboard = constants.zoneSelectKeyboard;
const adminId = constants.adminId;
const liveToken = tokens.liveToken;
const testingToken = tokens.testingToken;
const rvrcAngelMortalToken = tokens.rvrcAngelMortalToken;
const zoneAPassword = tokens.zoneAPassword;
const zoneBPassword = tokens.zoneBPassword;
const zoneCPassword = tokens.zoneCPassword;
const shuffleArray = functions.shuffleArray;
const sleep = functions.sleep;

///* express routing setup *///
const app = express();

// cron job - ping every 2 mins to maintain instance
app.get('/', (req, res) => {
  res
    .status(200)
    .send('Hello, world!')
    .end();
});


// cron job - restart bot polling every 10 mins
// workaround? It dies randomly for no reason...
app.get('/restart', (req, res) => {
	/*
	bot = null;
	sleep(10000);
	bot = new telegramBot(token, {polling: true});
	*/
	
	bot.stopPolling();
	sleep(2000);
	bot.startPolling();
	//console.log("Restarted bot.");
	
	res
		.status(200)
		.send("Restarted bot.")
		.end();
});


// cron job - ping every 60 mins to clear sessions >=20 mins old
// app.get("/timeoutCheck", (req, res) => {
// 	let sessionDeleteCount = 0;
	
// 	for (const i of Object.keys(activeSessions)) {
// 		if (checkTimeout(activeSessions[i])) {
// 			delete activeSessions[i];
// 			sessionDeleteCount += 1;
// 		}
// 	}

// 	if (sessionDeleteCount > 0) {
// 		console.log(`Deleted ${sessionDeleteCount} sessions.`);
// 	}
	
// 	res
// 		.status(200)
// 		.send(`Timeoutcheck done.`)
// 		.end();
// });

// app.get(`/${pairingCode}`, (req, res) => {
//   assignPairings();
  
//   res
//     .status(200)
//     .send("Pairings assigned!")
//     .end();
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

///* firebase database setup *///
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rusa-angel-mortal-bot.firebaseio.com",
  databaseAuthVariableOverride: {
    uid: "master-account"
  }
});

const db = admin.database();
const userRef = db.ref("users");

// database access functions
async function updateUser(userId, gender, zone, details) {
	// set zone-specific entry for pairings
	await db.ref(`zones/${zone}/${userId}`).set({details: details, gender: gender});
	// set global entry for sending messages
	// set attributes separately to avoid overriding any existing data at this entry
	await db.ref(`users/${userId}/details`).set(details);
	await db.ref(`users/${userId}/gender`).set(gender);
}

async function listUsers(zone, adminChatId) {
	bot.sendMessage(adminChatId, `ADMIN: Here are the registered users for zone ${zone}, in no particular order:`);
	await db.ref(`zones/${zone}`).once("value", function(snapshot) {
		let currCount = 0;
		let totalCount = 0;
		let msg = "";
		snapshot.forEach(function(user) {
			currCount++;
			totalCount++;
			msg += `"${user.val().details}"\n\n`;
			if (currCount == 40) {
				bot.sendMessage(adminChatId, msg);
				currCount = 0;
				msg = "";
			}
		})
		if (currCount != 0) bot.sendMessage(adminChatId, msg);
	})
}

async function assignPairings(zone, adminChatId, alternateGenders = true) {
	bot.sendMessage(adminChatId, `Running pairing algorithm for zone ${zone}...`);
	var allPlayers = [];
	if (alternateGenders) {
		var malePlayers = [];
		var femalePlayers = [];
		var otherPlayers = [];
		await db.ref(`zones/${zone}`).once("value", function(snapshot) {
			snapshot.forEach(function(user) {
				if (user.val().gender == "M") malePlayers.push(user.key);
				else if (user.val().gender == "F") femalePlayers.push(user.key);
				else otherPlayers.push(user.key);
			});
		});
		
		malePlayers = shuffleArray(malePlayers);
		femalePlayers = shuffleArray(femalePlayers);
		otherPlayers = shuffleArray(otherPlayers);
		
		const playersArray = [malePlayers, femalePlayers, otherPlayers];
		const maxLength = Math.max(malePlayers.length, femalePlayers.length, otherPlayers.length);
		for (let i = 0; i < maxLength; i++) { // iterate through shuffled arrays
			for (let j = 0; j < 3; j++) { // iterate through playersArray
				if (i < playersArray[j].length) allPlayers.push(playersArray[j][i]);
			}
		}
	} else {
		await db.ref(`zones/${zone}`).once("value", function(snapshot) {
			snapshot.forEach(function(user) {
				allPlayers.push(user.key);
			});
		});
		allPlayers = shuffleArray(allPlayers);
	}
	
	bot.sendMessage(adminChatId, "ADMIN: Here are the pairing results:");
  for (let i = 0; i < allPlayers.length; i++) {
    const angel = allPlayers[i];
    const mortal = allPlayers[(i + 1) % allPlayers.length];

    // set angel's mortal
    await db.ref(`users/${angel}/mortal`).set(mortal);
    // set mortal's angel
    await db.ref(`users/${mortal}/angel`).set(angel);
    // get mortal's details
    let details;
    let gender;
    await db.ref(`users/${mortal}`).once("value", function(snapshot) {
      details = snapshot.val().details;
      gender = snapshot.val().gender;
    });
    const message = "Hi angel! We have completed our angel-mortal pairings.\n\n"
                    + "Here's what your mortal said:\n"
                    + `"${details}"\n`
										+ `Gender: ${gender}\n\n`
										+ "You can now message them! For example: /mortal Hello mortal!\n\n"
										+ "Have fun!";
    bot.sendMessage(angel, message);
		bot.sendMessage(adminChatId, details);
	}
  
}

async function getAngel(userId) {
  var angel;
  await db.ref(`users/${userId}/angel`).once("value", function(snapshot) {
    angel = snapshot.val();
  });
  return angel;
}
  
async function getMortal(userId) {
  var mortal;
  await db.ref(`users/${userId}/mortal`).once("value", function(snapshot) {
    mortal = snapshot.val();
  });
  return mortal;
}

async function getPlayerGender(userId) {
	var gender;
	await db.ref(`users/${userId}/gender`).once("value", function(snapshot) {
    gender = snapshot.val();
	});
	return gender;
}

async function unregisterUser(userId) {
	await db.ref(`users/${userId}`).set(null);
	await db.ref(`zones/A/${userId}`).set(null);
	await db.ref(`zones/B/${userId}`).set(null);
	await db.ref(`zones/C/${userId}`).set(null);
	bot.sendMessage(userId, "You have been successfully unregistered from the game.");
}

async function test(id) {
	bot.sendMessage(id, "👨‍🦲*MORTAL*\n💬: " + "hi!!!", {parse_mode: "Markdown"});
}

///* main *///

const activeSessions = {};
const mealServicesCache = {};
const foundItemCache = {};
const menuFeedbackCache = {};

// replace the value below with the Telegram token you receive from @BotFather
// live
// const token = liveToken;
const token = rvrcAngelMortalToken;
// testing
// const token = testingToken;

// Create a bot that uses 'polling' to fetch new updates
let bot = new telegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    let dummyResponse; // to pass to processAction if Dialogflow is bypassed
	
	if (msg.text.slice(0, 7) == "/angel " && msg.text.slice(7) != '') {
		sendMessageToAngel(chatId, msg.text.slice(7));
	} else if (msg.text.slice(0, 8) == "/mortal " && msg.text.slice(8) != '') {
		sendMessageToMortal(chatId, msg.text.slice(8));
	} else {	

		switch(msg.text) {
			
			case "/about":
				bot.sendMessage(chatId, aboutMessage);
				break;
			
			case "/help":
				bot.sendMessage(chatId, helpMessage);
				break;
				
			case "/start":
				bot.sendMessage(chatId, startMessage);
				break;
			
			case "/admin":
				bot.sendMessage(chatId, verifyAdminMessage);
				break;

			case `${zoneAPassword} A`:
				assignPairings("A", chatId);
				break;
			
			case `${zoneBPassword} B`:
				assignPairings("B", chatId, false);
				break;

			case `${zoneCPassword} C`:
				assignPairings("C", chatId);
				break;

			case `listUsers ${zoneAPassword}`:
				listUsers("A", chatId);
				break;

			case `listUsers ${zoneBPassword}`:
				listUsers("B", chatId);
				break;

			case `listUsers ${zoneCPassword}`:
				listUsers("C", chatId);
				break;

			case "/unregister":
				unregisterUser(chatId);
				break;

			// case "test":
			// case "/test":
			// 	test(chatId);
			// 	break;

			default:
				awaitAndSendResponse(msg).catch(err => console.error(`Error awaitAndSendResponse: ${err}`));
		
		}
	}
});

bot.on('callback_query', (query) => {
	const queryId = query.id;
	const callbackData = query.data.split(' ');
	bot.answerCallbackQuery(queryId);

	processCallbackQuery(query);
});

async function awaitAndSendResponse(msg) {
	const chatId = msg.chat.id;
	bot.sendChatAction(chatId, "typing");
	const projectId = 'rusa-angel-mortal-bot';

	const sessionClient = new dialogflow.SessionsClient();
	let sessionPath = null;
	if (activeSessions[chatId]) {
		sessionPath = activeSessions[chatId].sessionPath;
		activeSessions[chatId] = {time: Date.now(),
								  sessionPath: sessionPath};
	} else {
		const sessionId = uuid.v4();
		sessionPath = sessionClient.sessionPath(projectId, sessionId);
		activeSessions[chatId] = {time: Date.now(),
								  sessionPath: sessionPath};
	}

	// The text query request.
	const request = {
		session: sessionPath,
		queryInput: {
			text: {
				text: msg.text,
				languageCode: 'en-US',
			},
		},
	};
	
	// Send request and log result
	const responses = await sessionClient.detectIntent(request);
	//console.log('Detected intent');
	const result = responses[0].queryResult;
	/*console.log(`  Query: ${result.queryText}`);
	console.log(`  Response: ${result.fulfillmentText}`);
	if (result.intent) {
		console.log(`  Intent: ${result.intent.displayName}`);
	} else {
		console.log(`  No intent matched.`);
	}*/
	
	// initialise text response to send back to user
	var responseText;
	var responseOptions = {parse_mode: "Markdown"};
	var sendingStyle = null;
	if (result.fulfillmentText) {
		responseText = result.fulfillmentText;
	}

	// if matched intent contains an action, call processAction
	if (result.action) {
		const actionResponse = await processAction(responses, chatId);
		
		// update each field only if processAction returns a non-null value
		if (actionResponse.message) {
			responseText = actionResponse.message;
		}
		if (actionResponse.options) {
			responseOptions = actionResponse.options;
		}
		if (actionResponse.sendingStyle) {
			sendingStyle = actionResponse.sendingStyle;
		}
	}
	
	/* Not currently needed
	// console.log(responses[0].queryResult.outputContexts);
	responses[0].queryResult.outputContexts.forEach(context => {
	  // There is a bug in gRPC that the returned google.protobuf.Struct
	  // value contains fields with value of null, which causes error
	  // when encoding it back. Converting to JSON and back to proto
	  // removes those values.
	  context.parameters = structjson.jsonToStructProto(
		structjson.structProtoToJson(context.parameters)
	  );
	});
	*/

	// send message back to Telegram
	if (sendingStyle === "sendAsJoke") {
		sendMultipleMessages(chatId, responseText, 2000);
	} else {
		bot.sendMessage(chatId, responseText, responseOptions);
	}
}

/* 
Handles processing for all intents that return an action.
Returns an object in the following form:
{
 responseText: string containing message to send,
 responseOptions: object corresponding to additional sendMessage parameters,
[sendingStyle]: string describing additional options (e.g. send as multiple messages)
}
*/

async function processAction(responses, id) {
	let result = responses[0].queryResult;
	const inputParams = result.parameters.fields;
	let responseText = result.fulfillmentText;
	let sendingStyle = null;
	let responseOptions = {parse_mode: "Markdown"};
	let dateNow = new Date(Date.now());
	
	switch (result.action) {
		
    case 'get-gender':
      responseOptions.reply_markup = genderSelectKeyboard;
      break;
		
    case 'get-zone':
			responseOptions.reply_markup = zoneSelectKeyboard;
	  	break;
	
		case 'update-user':
			const contextParameters = result.outputContexts[0].parameters.fields;
			const gender = contextParameters["gender"].stringValue;
			const zone = contextParameters["zone"].stringValue;
			const details = result.queryText;
			await updateUser(id, gender, zone, details);
			console.log("Registered: " + gender + ' / Zone ' + zone + ' / ' + details);
			responseText = result.fulfillmentText;
			responseOptions = null;
			break;

    case 'send-message-to-angel':
      const angelId = await getAngel(id);
			if (!angelId) responseText = pairingNotFoundMessage;
			else {
				bot.sendMessage(angelId, "👨‍🦲 *MORTAL*\n💬: " + result.queryText, {parse_mode: "Markdown"});
				responseText = messageSentMessage;
			}
      responseOptions = null;
      break;

    case 'send-message-to-mortal':
			const mortalId = await getMortal(id);
			if (!mortalId) responseText = pairingNotFoundMessage;
			else {
				bot.sendMessage(mortalId, "👼 *ANGEL*\n💬: " + result.queryText, {parse_mode: "Markdown"});
				responseText = messageSentMessage;
			}
      responseOptions = null;
      break;
      
		default:
			responseText = null;
			responseOptions = null;
	}

	return {message: responseText,
			options: responseOptions,
			sendingStyle: sendingStyle}
}

async function sendMessageToAngel(mortalId, message) {
	const angelId = await getAngel(mortalId);
	if (!angelId) bot.sendMessage(mortalId, pairingNotFoundMessage);
	else {
		bot.sendMessage(angelId, "👨‍🦲 *MORTAL*\n💬: " + message, {parse_mode: "Markdown"});
		bot.sendMessage(mortalId, messageSentMessage);
	}
}

async function sendMessageToMortal(angelId, message) {
	const mortalId = await getMortal(angelId);
	if (!mortalId) bot.sendMessage(angelId, pairingNotFoundMessage);
	else {
		bot.sendMessage(mortalId, "👼 *ANGEL*\n💬: " + message, {parse_mode: "Markdown"});
		bot.sendMessage(angelId, messageSentMessage);
	}
}

async function processCallbackQuery(query) {
	const chatId = query.from.id;
	const queryId = query.id;
	const messageId = query.message.message_id;
	let callbackData = query.data;
	
	let responseText = '';
	let sendingStyle = null;
	let responseOptions = {parse_mode: "Markdown"};
	
	switch (callbackData.split(' ')[0]) {
	
		default:
		
	}
}
///* helper functions *///

async function sendWithoutDialogflow(chatId, dummyResponse) {
    bot.sendChatAction(chatId, "typing");
    const result = await processAction(dummyResponse, chatId);
    bot.sendMessage(chatId, result.responseText, result.responseOptions);
}

async function sendMultipleMessages(chatId, msgs, delay) {
	bot.sendMessage(chatId, msgs.shift());
	for (const i in msgs) {
		bot.sendChatAction(chatId, "typing");
		await sleep(delay);
		bot.sendMessage(chatId, msgs[i]);
		await sleep(500);
	}
}
