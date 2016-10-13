'use strict'

const express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  Q = require('q'),
  app = express(),
  getBotHandler = require('./get-bot-handler.js').getBotHandler;

// should this just be declared in FB bot module?
const token = process.env.FB_PAGE_ACCESS_TOKEN
// is this even used?
// const GH_token = process.env.GH_API_ACCESS_TOKEN

// simple test bots
var hellobot = require('./hellobot.js'),
 dicebot = require('./dicebot.js');

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

// ***************************************
// unified api endpoint
// ***********************

// -Temporarily using this endpoint, change to V3/ when Slack issue handled
app.post('/gethuman', function (req, res) {
// app.post('/v3/webhook', function (req, res) {
  // put data from the Express req object into our custom context object
  var platformRequestContext = {
    userRequest: req.body,
    disableSeparateResponse: !!req.params.istest
  };
  console.log("Platform request: " + JSON.stringify(platformRequestContext));
  // get a BotHandler object based on the context
  // should send an error if no appropriate bot found
  var botHandler = getBotHandler(platformRequestContext);

  botHandler.getResponsePayload(platformRequestContext)
    // this is an object that contains { raw: {}, data: {}, context: {} }
    .then(function (responsePayload) {
      console.log("About to send a message back to Client: " + JSON.stringify(responsePayload));

      // This sends a delayed response after the immediate 200 response
      // (default false, but true for Slack)
      if (platformRequestContext.disableSeparateResponse) {
        res.status(200).end();
        botHandler.sendResponseToPlatform(responsePayload);
      }
      else {
        res.send(responsePayload.raw);
      }

    })
    .catch(function (err) {
      console.error(err);
      // get response object that contains the thing you want to send to
      // the bot when an error occurs
      var errorPayload = botHandler.getErrorPayload(err, platformRequestContext);
      // this should log error and then call botHandler.sendResponseToPlatform()
      // under the scenes
      if (platformRequestContext.disableSeparateResponse) {
        res.status(200).end();
        botHandler.sendErrorResponse(errorPayload)
      }
      else {
        res.send(errorPayload.raw);
      }
    });
});


