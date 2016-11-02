'use strict'

var brainServer = require('./brain/server');
var config = require('./config/config');

var botHandlers = {
  slack: require('./bots/slack.bot'),
  messenger: require('./bots/messenger.bot')
}

// each type of action has its own handler
var actionHandlers = [
  require('./actions/solve.action'),
  require('./actions/confirm.action')
];

// start the chat server
brainServer.start(botHandlers, actionHandlers, config);
