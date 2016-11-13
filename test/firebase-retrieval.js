let firebase = require('firebase');

let config = require('../src/config/config');

// Initialize Firebase
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
// Get a reference to the database service
// var ref = firebase.database().ref('test/');

// ref.child('wow').on('value', function(snapshot) {
//   console.log('Value of wow is now: '
//     + JSON.stringify(snapshot.val()));
// });

var teamId  = 'T30298GCF';

var ref = firebase.database().ref('gh/slack/teams');

ref.child(teamId).on('value', function(snapshot) {
  console.log('Value of'
    + teamId
    + 'is now: '
    + JSON.stringify(snapshot.val()));
});