'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const token = process.env.FB_PAGE_ACCESS_TOKEN
// is this even used?
const GH_token = process.env.GH_API_ACCESS_TOKEN

var hellobot = require('./hellobot.js');
var dicebot = require('./dicebot.js');
// now using experimental Promise version
var ghSlackBot = require('./gh-slack-promises.js');
var ghFacebookBot = require('./gh-facebook-bot.js');

var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

// hellobot - keep for testing
app.post('/hello', hellobot);
// dicebot - keep for testing
app.post('/roll', dicebot);
// gethuman bot for Slack
app.post('/gethuman', ghSlackBot);
// gethuman bot for FB
app.post('/webhook/', ghFacebookBot);

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
})

app.listen(port, function () {
  console.log('Fusion bot listening on port ' + port);
});