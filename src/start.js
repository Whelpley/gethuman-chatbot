'use strict';

let firebase = require('firebase');
let Q = require('q');

let brainServer = require('./brain/server');
let config = require('./config/config');

let botHandlers = {
  slack: require('./bots/slack.bot'),
  messenger: require('./bots/messenger.bot')
};

let actionHandlers = [
  require('./actions/solve.action'),
  require('./actions/ignore.action')
];

Q.when(accessFirebaseData())
.then(function(firebaseData) {
  brainServer.start(botHandlers, actionHandlers, config, firebaseData);
});

// Contact Firebase and obstain a reference
function accessFirebaseData() {
  var firebaseData = {};

  var firebaseApiKey = config.firebaseApiKey;
  var firebaseProjectName = config.firebaseProjectName;
  var firebaseSenderId = config.firebaseSenderId;
  var firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain:  firebaseProjectName + '.firebaseapp.com',
      databaseURL: 'https://' + firebaseProjectName + '.firebaseio.com',
      storageBucket: firebaseProjectName + '.appspot.com',
      messagingSenderId: firebaseSenderId
  };
  console.log('Prepared config for Firebase: ' + JSON.stringify(firebaseConfig));

  firebase.initializeApp(firebaseConfig);

  firebase.database().ref('gh/').on('value', function(snapshot) {
    Object.assign(firebaseData, snapshot.val());
    console.log("Firebase data updated");
  });

  return firebaseData;
}
