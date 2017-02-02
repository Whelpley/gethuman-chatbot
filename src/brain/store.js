let Q = require('q');
let firebase = require('firebase');

let config = require('../config/config');

/**
 * Contacts Firebase and returns a reference to the database
 *
 * @returns state {promise} - state of the database (updates real-time)
 */
function initialize() {
  var state = {};
  var firebaseApiKey = config.firebaseApiKey;
  var firebaseProjectName = config.firebaseProjectName;
  var firebaseSenderId = config.firebaseSenderId;
  var firebaseConfig = {
      apiKey: firebaseApiKey,
      authDomain: firebaseProjectName + '.firebaseapp.com',
      databaseURL: 'https://' + firebaseProjectName + '.firebaseio.com',
      storageBucket: firebaseProjectName + '.appspot.com',
      messagingSenderId: firebaseSenderId
  };

  firebase.initializeApp(firebaseConfig);

  // assigns the database state to the "state" object
  firebase.database().ref('gh/').on('value', function(snapshot) {
    Object.assign(state, snapshot.val());
  });

  return Q.when(state);
}

module.exports = {
  initialize: initialize
};