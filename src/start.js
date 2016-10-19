'use strict'

var chatServer = require('./chat-server');

var botHandlers = [
  require('./bot-handlers/slack-handler'),
  require('./bot-handlers/messenger-handler')
];

var actionHandlers = [
  require('./actions/action-problem-lookup')
];

chatServer.startServer(botHandlers, actionHandlers);
