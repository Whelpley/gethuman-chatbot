let brainServer = require('./brain/server');
let config = require('./config/config');

let botHandlers = {
  slack: require('./bots/slack.bot'),
  messenger: require('./bots/messenger.bot')
};

// each type of action has its own handler
let actionHandlers = [
  require('./actions/solve.action'),
  require('./actions/confirm.action')
];

// start the chat server
brainServer.start(botHandlers, actionHandlers, config);
