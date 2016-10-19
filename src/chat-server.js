'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var utilities = require('./services/utilities')
var Q = require('q');
var brain = require('./brain');

function startServer(botHandlers, actionHandlers) {
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

  // Slack hellobot - keep for testing
  app.post('/hello', require('./deprecated/hellobot.js'));
  // Slack dicebot - keep for testing
  app.post('/roll', require('./deprecated/dicebot.js'));
  // for Facebook verification
  app.get('/v3/gethuman', function (req, res) {
    var context = getContextFromExpressReqRes(req, res);
    var botHandler = getBotHandler(context);
    botHandler.verify(req, res);
  })

// reaches Slack version
  app.post('/gethuman', handleRequest(botHandlers, actionHandlers));
// FB version
  app.post('/v3/gethuman', handleRequest(botHandlers, actionHandlers));

  app.listen(port, function () {
    console.log('Fusion bot listening on port ' + port);
  });

  return app;
}

// is unit testable
function handleRequest(botHandlers, actionHandlers) {
  return function (req, res) {

    console.log("Incoming request: " + JSON.stringify(req.body));

    var context = getContextFromExpressReqRes(req, res);
    var botHandler = brain.getBotHandler(botHandlers, context);

//************** NON-WORKING CODE rethinking structure

    // // translating the JSON body of the request from the bot platform format
    // // into a common format that we define
    // var commonRequestData = botHandler.translateRequstToCommonFormat(context);

    // // first get the action handler (right now just the problem lookup)
    // brain.getActionHandler(actionHandlers, commonRequestData)
    //   .then(function (action) {
    //     return action.processRequest(commonRequestData);
    //   })
    //   .then(function (commonResponseData) {
    //     var botSpecificResponse = botHandler.translateResponseToCommonFormat(commonResponseData);
    //     return botHandler.sendResponseToPlatform(botSpecificResponse);
    //   })
    //   .catch(function (err) {
    //     botHandler.sendErrorResponse(err, context);
    //   });


//************** END NON-WORKING CODE rethinking structure

    // this is working code
    utilities.preResponse(context);

// botHandler should first detect if this is a message that needs a reply before starting this chain
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
function getContextFromExpressReqRes(req, res) {
  return {
    userRequest: req.body,
    isTest: !!req.params.istest,
    // not used in either FB or Slack bots, keep for testing
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
  getContextFromExpressReqRes: getContextFromExpressReqRes
}
