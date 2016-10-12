'use strict'

const express = require('express'),
 bodyParser = require('body-parser'),
 request = require('request'),
 Q = require('q'),
 app = express();

// should this just be declared in FB bot module?
const token = process.env.FB_PAGE_ACCESS_TOKEN
// is this even used?
const GH_token = process.env.GH_API_ACCESS_TOKEN

var hellobot = require('./hellobot.js'),
 dicebot = require('./dicebot.js');
 // ghSlackBot = require('./gh-slack-promises.js'),
 // ghFacebookBot = require('./gh-facebook-bot.js');

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
// gethuman bot for Slack - to be deprecated
// app.post('/gethuman', ghSlackBot);
// gethuman bot for FB - to be deprecated
// app.post('/webhook/', ghFacebookBot);

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

  Q.when(botHandler.getResponsePayload(platformRequestContext))
    // this is an object that contains { raw: {}, data: {}, context: {} }
    .then(function (responsePayload) {
      // this is the response to the original request
      // (comment this out if for now if needed return for Facebook/other bots)
      res.send(responsePayload.raw);
      // this is really only if need brand new request back to platform
      // i.e. used for slack (but messenger this may be empty)

      if (!platformRequestContext.disableSeparateResponse) {
        botHandler.sendResponseToPlatform(responsePayload);
      }

      // possibly an if/else required if two different Sends will break it
    })
    .catch(function (err) {
      // get response object that contains the thing you want to send to
      // the bot when an error occurs
      var errorPayload = botHandler.getErrorPayload(err, platformRequestContext);
      // send response to original request
      res.send(errorPayload.raw);
      // this should log error and then call botHandler.sendResponseToPlatform()
      // under the scenes
      botHandler.sendErrorResponse(errorPayload)
        .then(function () {
          res.status(200).end();
        });
    });
});


// export this to a module
var handlers = [require('./slack-handler'), require('./messenger-handler')];

function getBotHandler(platformRequestContext) {
  // loop through handlers and call handlers[i].isHandlerForRequest(platformRequestContext)

  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].isHandlerForRequest(platformRequestContext)) {
      console.log("Found a bot to handle request!");
      return handlers[i];
    };
  };

  // else if handler not found, throw error
  throw "Request coming from unrecognized platform";
}