'use strict';

let Q = require('q');

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

Q.when(store.initialize())
.then(function(state) {
  server.start(botHandlers, actionHandlers, config, state);
});

// Q.when(accessFirebaseData())
// .then(function(firebaseData) {
//   brainServer.start(botHandlers, actionHandlers, config, firebaseData);
// });

// Contact Firebase and obstain a reference
// move function to a file called Store (in Store), change funciton name to "initialize"
// have it return a State
// function accessFirebaseData() {
//   var firebaseData = {};

//   var firebaseApiKey = config.firebaseApiKey;
//   var firebaseProjectName = config.firebaseProjectName;
//   var firebaseSenderId = config.firebaseSenderId;
//   var firebaseConfig = {
//       apiKey: firebaseApiKey,
//       authDomain:  firebaseProjectName + '.firebaseapp.com',
//       databaseURL: 'https://' + firebaseProjectName + '.firebaseio.com',
//       storageBucket: firebaseProjectName + '.appspot.com',
//       messagingSenderId: firebaseSenderId
//   };
//   console.log('Prepared config for Firebase: ' + JSON.stringify(firebaseConfig));

//   firebase.initializeApp(firebaseConfig);

//   firebase.database().ref('gh/').on('value', function(snapshot) {
//     Object.assign(firebaseData, snapshot.val());
//     console.log("Firebase data updated");
//   });

//   return firebaseData;
// }



let botHandlers = {
  slack: require('./bots/slack.bot'),
  messenger: require('./bots/messenger.bot')
};

let actionHandlers = [
  require('./actions/solve.action'),
  require('./actions/ignore.action')
];

store.initialize()
.then(function(state) {
  server.start(botHandlers, actionHandlers, state);
});

