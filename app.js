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
const genderSelectKeyboard = constants.genderSelectKeyboard;
const adminId = constants.adminId;
const liveToken = tokens.liveToken;
const testingToken = tokens.testingToken;
const pairingCode = tokens.pairingCode;
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
app.get("/timeoutCheck", (req, res) => {
	let sessionDeleteCount = 0;
	
	for (const i of Object.keys(activeSessions)) {
		if (checkTimeout(activeSessions[i])) {
			delete activeSessions[i];
			sessionDeleteCount += 1;
		}
	}

	if (sessionDeleteCount > 0) {
		console.log(`Deleted ${sessionDeleteCount} sessions.`);
	}
	
	res
		.status(200)
		.send(`Timeoutcheck done.`)
		.end();
});

app.get(`/${pairingCode}`, (req, res) => {
  assignPairings();
  
  res
    .status(200)
    .send("Pairings assigned!")
    .end();
});

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
async function updateUser(userId, queryText) {
  await db.ref(`users/${userId}/details`).set(queryText);
}

async function updateUserGender(userId, genderString) {
  const gender = genderString == "Male"
             ? "M"
             : genderString == "Female"
               ? "F"
               : "O";
  await db.ref(`users/${userId}/gender`).set(gender);
}

async function assignPairings() {
  var allPlayers = [];
  var malePlayers = [];
  var femalePlayers = [];
  var otherPlayers = [];
  await db.ref('users').once("value", function(snapshot) {
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
  const detailsArray = [];
  const maxLength = Math.max(malePlayers.length, femalePlayers.length, otherPlayers.length);
  for (let i = 0; i < maxLength; i++) { // iterate through shuffled arrays
    for (let j = 0; j < 3; j++) { // iterate through playersArray
      if (i < playersArray[j].length) allPlayers.push(playersArray[j][i]);
    }
  }
  
  for (let i = 0; i < allPlayers.length; i++) {
    const angel = allPlayers[i];
    const mortal = allPlayers[(i + 1) % allPlayers.length];

    // set angel's mortal;
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
    const message = "Hi angel! We have completed our angel-mortal pairings.\n"
                    + "Here's what your mortal said:\n"
                    + details
                    + "\nGender: "
                    + gender;
    detailsArray.push(details);
    bot.sendMessage(angel, message);
  }
  bot.sendMessage(adminId, detailsArray);
  
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

///* main *///

const activeSessions = {};
const mealServicesCache = {};
const foundItemCache = {};
const menuFeedbackCache = {};

// replace the value below with the Telegram token you receive from @BotFather
// live
// const token = liveToken;
// testing
const token = testingToken;

// Create a bot that uses 'polling' to fetch new updates
let bot = new telegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
	console.log(msg.chat.id);
	console.log(msg.chat);
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

		default:
			awaitAndSendResponse(msg).catch(err => console.error(`Error awaitAndSendResponse: ${err}`));
	
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
	let responseText = '';
	let sendingStyle = null;
	let responseOptions = {parse_mode: "Markdown"};
	let dateNow = new Date(Date.now());
	
	switch (result.action) {
		
    case 'update-user-details':
      await updateUser(id, result.queryText);
      responseText = "Great! Please also select your gender from the given options:";
      responseOptions.reply_markup = genderSelectKeyboard;
      break;
		
    case 'update-user-gender':
      await updateUserGender(id, result.parameters.fields.gender.stringValue);
      responseText = "All done! The house comm will provide further updates.";
      responseOptions = null;
      break;
    
    case 'send-message-to-angel':
      const angelId = await getAngel(id);
      bot.sendMessage(angelId,
                      `Message from mortal: ${result.queryText}`,
                      responseOptions);
      responseText = "Message delivered!";
      responseOptions = null;
      break;
      
    case 'send-message-to-mortal':
      const mortalId = await getMortal(id);
      bot.sendMessage(mortalId,
                      `Message from angel: ${result.queryText}`,
                      responseOptions);
      responseText = "Message delivered!";
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
