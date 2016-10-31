'use strict'


var brainServer = require('./brain/server');
var config = require('./config/config');

// each target bot has its own handler
// var botHandlers = {
//   slack:  require('./bots/slack.bot'),
//   messenger: require('./bots/messenger.bot')
// }

// old
var botHandlers = [
  require('./bots/slack.bot'),
  require('./bots/messenger.bot')
];

// each type of action has its own handler
var actionHandlers = [
  require('./actions/solve.action')
];

// start the chat server
brainServer.start(botHandlers, actionHandlers, config);
