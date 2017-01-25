let server = require('./brain/server');
let store = require('./brain/store');
let config = require('./config/config');

let botHandlers = {
  slack: require('./bots/slack.bot'),
  messenger: require('./bots/messenger.bot')
};

let actionHandlers = [
  require('./actions/solve.action'),
  require('./actions/ignore.action')
];

store.initialize()
.then((state) => {
  server.start(botHandlers, actionHandlers, config, state);
});

