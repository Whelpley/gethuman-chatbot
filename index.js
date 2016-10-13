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
// unified api endpoint (kinda)
// ***********************

app.post('/gethuman', handleRequest);
app.post('/v3/gethuman', handleRequest);

function handleRequest(req, res) {
  // put data from the Express req object into our custom context object
  var context = getContextFromExpressReqRes(req, res);
  console.log("Platform request: " + JSON.stringify(context));
  // get the bot handler
  var botHandler = getBotHandler(context);
  // get the response payload from the handler
  botHandler.getResponsePayload(context)
    .then(function (responsePayload) {
      // console.log("About to send a message back to Client: " + JSON.stringify(responsePayload));
      // send back the response
      botHandler.sendResponseToPlatform(responsePayload);
    })
    .catch(function (err) {
      botHandler.sendErrorResponse(err, context);
    });
}

function getContextFromExpressReqRes(req, res) {
  return {
    userRequest: req.body,
    isTest: !!req.params.istest,
    sendResponse: function (payload) {
      res.send(payload);
    }
  };
}
