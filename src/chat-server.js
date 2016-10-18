'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var Q = require('q');

function startServer(handlers) {
  console.log('Starting server');
  var port = process.env.PORT || 3000;
  var app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json())
  app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(400).send(err.message);
  });

  // test route
  app.get('/', function (req, res) {
    res.status(200).send('Hello world!')
  });

  // hellobot - keep for testing
  app.post('/hello', require('./deprecated/hellobot.js'));
  // dicebot - keep for testing
  app.post('/roll', require('./deprecated/dicebot.js'));
  // for Facebook verification
  app.get('/v3/gethuman', function (req, res) {
    //---change to this:
    // var context = getContextFromExpressReqRes(req, res);
    // var botHandler = getBotHandler(context);
    // botHandler.verify();
    console.log("Receiving webhook verification from FB.")

    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
  })

// reaches Slack version
  app.post('/gethuman', handleRequest(handlers));
// FB version
  app.post('/v3/gethuman', handleRequest(handlers));
  // old version for dissection
  // app.post('/v3/gethuman', require('./deprecated/gh-facebook-bot.js'));

  app.listen(port, function () {
    console.log('Fusion bot listening on port ' + port);
  });

  return app;
}

// is unit testable
function handleRequest(handlers) {
  return function (req, res) {

    console.log("Incoming request: " + JSON.stringify(req.body));

    var context = getContextFromExpressReqRes(req, res);
    // console.log("About to send back Status 200 to response object.")
    context.finishResponse();

    var botHandler = getBotHandler(handlers, context);
    botHandler.getResponsePayload(context)
      .then(function (responsePayload) {
        botHandler.sendResponseToPlatform(responsePayload);
      })
      .catch(function (err) {
        botHandler.sendErrorResponse(err, context);
      });
  }
}

// is unit testable
function getBotHandler(handlers, context) {
  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].isHandlerForRequest(context)) {
      console.log("Found a bot to handle request: # " + i + " in handlers");
      return handlers[i];
    };
  };
  // else if handler not found, throw error
  throw "Request coming from unrecognized platform";
}

// is unit testable
function getContextFromExpressReqRes(req, res) {
  return {
    userRequest: req.body,
    isTest: !!req.params.istest,
    sendResponse: function (payload) {
      res.send(payload);
    },
    finishResponse: function() {
      res.status(200).end();
    }
  };
}

module.exports = {
  startServer: startServer,
  getBotHandler: getBotHandler,
  getContextFromExpressReqRes: getContextFromExpressReqRes
}
