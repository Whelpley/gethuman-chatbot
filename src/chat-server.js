'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var Q = require('q');
var utilities = require('./services/utilities')
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
    // var context = getContextFromExpressReqRes(req, res);
    // var botHandler = brain.getBotHandler(context);
    // botHandler.verify(req, res);
    console.log("Receiving webhook verification from FB.");
    console.log("Body of webhook verification from FB: " + JSON.stringify(req.body));
    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
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

// // filters out a FB confirmation message (also happens later in code)
// // (not needed?)
//     if (req.body.entry && req.body.entry.length &&
//       req.body.entry[0].messaging && req.body.entry[0].messaging.length &&
//       !!req.body.entry[0].messaging[0].delivery) {

//       console.log('sending back resp 200 right away');
//       res.status(200).send();
//       return;
//     };

    var context = getContextFromExpressReqRes(req, res);
    var botHandler = brain.getBotHandler(botHandlers, context);
    var actionHandler = brain.getActionHandler(actionHandlers);

    utilities.preResponse(context);

    var commonRequest = botHandler.translateRequestToCommonFormat(context);

    if (commonRequest) {
      actionHandler.processRequest(commonRequest)
        .then(function (commonResponse) {
          // form up the payloads
          console.log("Common Response about to be passed in to bot handler for translation to Platorm response.");
          var botSpecificResponse = botHandler.translateCommonResponseToPlatform(commonResponse);
          console.log("Successful translation to Platorm response.");
          // may not be necessary.... already is an array
          var payloads = [].concat(botSpecificResponse.payloads || []);
          var context = botSpecificResponse.context;
          // make an array of call functions
          var calls = payloads.map(function (payload) {
            return function () {
              return botHandler.sendResponseToPlatform(payload, context)
                .catch(function (err) {
                  console.log('err is ' + err);
                });
            }
          });
          return chainPromises(calls);
        })
        .catch(function (err) {
          botHandler.sendErrorResponse(err, context);
        });
    }
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

function chainPromises(calls, val) {
  if (!calls || !calls.length) {
    return Q.when(val);
  }
  return calls.reduce(Q.when, Q.when(val));
};

module.exports = {
  startServer: startServer,
  getContextFromExpressReqRes: getContextFromExpressReqRes
}
