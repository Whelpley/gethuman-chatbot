'use strict';

let request = require('request');
let express = require('express');
let firebase = require('firebase');

let app = express();

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
var ref = firebase.database().ref('gh/slack/teams');

const DONE = `
            <html>
                <body>
                    <h1>DONE!</h1>
                </body>
            </html>
        `;

const SLACKBTN = `
            <html>
                <body>
                    <a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands&client_id=84580660657.100595915399"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
                </body>
            </html>
        `;

function process(req, res) {
    let code = req.query && req.query.code;
    let clientId = config.slackClientId;
    let clientSecret = config.slackClientSecret;

    if (code) {

        let opts = {
            method: 'POST',
            url: 'https://slack.com/api/oauth.access',
            qs: {
                'client_id': clientId,
                'client_secret': clientSecret,
                'code': code
            }
        };
        console.log('Code detected, making request with options: ' + JSON.stringify(opts));

        request(opts, function (err, resp, body){

            // console.log('OAuth call made, retrieved token info:' + JSON.stringify(body));
            console.log('OAuth call made, retrieved token info:' + body);

            // add hacked code to save to firebase database
            // need staging and production DB's
            // To save to DB - whole object
            var parsedBody = JSON.parse(body);
            if (parsedBody.ok) {
                let teamId = parsedBody.team_id;
                console.log('About to save this body to Firebase: ' +JSON.stringify(parsedBody));
                ref.child(teamId).set(parsedBody);

                 // retrieve data to test it!
                // ref.child(teamId).on('value', function(snapshot) {
                //   console.log('Value of team '
                //     + teamId
                //     + 'now updated to: '
                //     + JSON.stringify(snapshot.val()));
                // });
            }

            res.send(DONE);
        });
    } else {
        res.send(SLACKBTN);
    }
}

app.get('/', process);
app.get('/:foo', process);

app.listen(8181, function() {
    console.log('API listening for bots on port 8181');
});