'use strict';

let firebase = require('firebase');
let config = require('../config/config');

/**
 * Contacts Firebase and returns a reference to the database
 *
 * @returns state
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
  console.log('Prepared config for Firebase: ' + JSON.stringify(firebaseConfig));

  firebase.initializeApp(firebaseConfig);

  firebase.database().ref('gh/').on('value', function(snapshot) {
    Object.assign(state, snapshot.val());
    console.log("Firebase data updated");
  });

  return state;
}

module.exports = {
  initialize: initialize
};