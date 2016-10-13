'use strict'

var chatServer = require('./chat-server');
var handlers = [
  require('./bot-handlers/slack-handler'),
  require('./bot-handlers/messenger-handler')
];

chatServer.startServer(handlers);
