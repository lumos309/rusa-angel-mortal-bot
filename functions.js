// functions that are too long for the main program file

const constants = require('./constants.js');
const request = require('request-promise');
const parser = require('node-html-parser');
const aboutMessage = constants.aboutMessage;
const helpMessage = constants.helpMessage;
const startMessage = constants.startMessage;
const yesNoKeyboard = constants.yesNoKeyboard;
const creditsURL = constants.creditsURL;
const menuURL = constants.menuURL;

function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.shuffleArray = shuffleArray;
module.exports.sleep = sleep;
