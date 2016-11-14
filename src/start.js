'use strict';

let firebase = require('firebase');
let Q = require('q');

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
// not sure if this needs to be promise-chained
Q.when(intializeDatabase())
.then(function(database){
  brainServer.start(botHandlers, actionHandlers, config, database);
});

// Contact Firebase and obstain a reference
// where is this an async operation?
function intializeDatabase() {
  var firebaseApiKey = config.firebaseApiKey;
  var firebaseProjectName = config.firebaseProjectName;
  var firebaseSenderId = config.firebaseSenderId;
  var firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain:  firebaseProjectName + '.firebaseapp.com',
      databaseURL: 'https://' + firebaseProjectName + '.firebaseio.com',
      storageBucket: firebaseProjectName + '.appspot.com',
      // not sure if this part is needed
      messagingSenderId: firebaseSenderId
  };
  console.log('Prepared config for Firebase: ' + JSON.stringify(firebaseConfig));
  firebase.initializeApp(firebaseConfig);

  var database = firebase.database().ref('gh/');
  return database;
}
