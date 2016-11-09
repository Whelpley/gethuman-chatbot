'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var Q = require('q');
var request = require('request');

var utilities = require('./utilities');
var factory = require('./factory');
var messenger = require('../bots/messenger.bot');

/**
 * Main entry point for the bot server
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 */
function start(botHandlers, actionHandlers, config) {
  var port = process.env.PORT || 3000;
  var app = express();

  console.log('Starting server');

  addMiddleware(app);

  // remove these
  // addTestRoutes(app);

  // all bots go to this route
  app.post('/:bot', handleRequest(botHandlers, actionHandlers, config));
  // app.all('/:bot', handleRequest(botHandlers, actionHandlers, config));

  // look up Express - app.all - figure out how to process FBM verification
    // should be able to see if it's a Get or Post

  // FB Messenger verification route
  app.get('/messenger', function(req, res) {
    messenger.verify(req, res);
  });

  // FB Messenger verification route
  app.get('/oauth', function(req, res) {
    console.log('GET request to /oauth path: ' + req.body);
    slack.oauthResponse(req, res);
  });

  app.listen(port, function() {
    console.log('API listening for bots on port ' + port);
  });
}

/**
 * Add Express middleware
 *
 * @param app The express server
 */
function addMiddleware(app) {
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
}

/**
 * Add test routes (remove in the future)
 *
 * @param app The express server
 */
// function addTestRoutes(app) {

//   // test route
//   app.get('/', function (req, res) {
//     res.status(200).send('Hello world!')
//   });

//   // Slack hellobot - keep for testing
//   app.post('/hello', require('../deprecated/hellobot.js'));
//   // Slack dicebot - keep for testing
//   app.post('/roll', require('../deprecated/dicebot.js'));
// }

/**
 * Handle requests from the bots to our api
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 * @returns {Function}
 */
function handleRequest(botHandlers, actionHandlers, config) {
  return function(req, res) {
    var context = getContext(req, res, config);
    console.log('Context captured from request: ' + JSON.stringify(context));

    // send back a 200 response immediately
    context.finishResponse();

    var botHandler = factory.getBotHandler(botHandlers, context);

    var genericRequests = botHandler.translateRequestToGenericFormats(context);

    genericRequests.forEach((genericRequest) => {
      var actionHandler = factory.getActionHandler(actionHandlers, genericRequest);
      try {
        actionHandler.processRequest(genericRequest)
            .then(function(genericResponse) {
              // console.log("Generic Response returned in Server: " + genericResponse);
              var payloads = botHandler.generateResponsePayloads(genericResponse);
              // console.log("Payloads generated: " + JSON.stringify(payloads));
              return sendResponses(context, payloads);
            })
            .done();
      } catch(error) {
        console.log('Catching an error in Try/Catch in server: ' + error);
      }
    });
  };
}

/**
 * Lines up payloads and sequentially calls Send for each
 *
 * @param context
 * @param payloads
 * @returns {Promise}
 */
function sendResponses(context, payloads) {
  // cut off function if no payloads
  if (!payloads) {
    return null;
  };
  // force payloads into an array (is this necessary?)
  payloads = [].concat(payloads || []);
  var calls = payloads.map(function(payload) {
    return function() {
      return sendResponseToPlatform(context, payload)
          .catch(function(err) {
            console.log('Error from send to platform: ' + err);
          });
    };
  });
  return utilities.chainPromises(calls);
}

/**
 * Checks to see if payload should actually be sent to a platform
 * If so, passes it to Send fuction
 *
 * @param context
 * @param payload
 * @return {sendRequestAsReply}
 */
function sendResponseToPlatform(context, payload) {
  if (context.isTest) {
    console.log("Test flag detected in payload context.");
    context.sendResponse(payload);
    return Q.when();
  } else if (!payload || (payload === {})) {
    // sf this part needed?
    console.log("No payload data detected.");
    return Q.when();
  } else {
    return sendRequestAsReply(payload, context);
  }
}

/**
 * Makes the request to send to payload
 *
 * @param context
 * @param payload
 * @return {Promise}
 */
function sendRequestAsReply(payload, context) {
  var deferred = Q.defer();
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  request(payload, function(error, response, body) {
    if (error) {
      console.log("Ran into error while making request to send Slack payload: " + error);
      deferred.reject(error);
    } else {
      deferred.resolve();
    }
  });
  return deferred.promise;
}

/**
 * Create a generic context object from the Express
 * request and response objects
 *
 * @param req
 * @param res
 * @param config
 * @returns {context}
 */
function getContext(req, res, config) {
  return {
    config: config,
    userRequest: req.body,
    isTest: !!req.params.isTest,
    bot: req.params.bot,
    sendResponse: function(payload) {
      res.send(payload);
    },
    finishResponse: function() {
      res.status(200).end();
    }
  };
}

module.exports = {
  start: start,
  addMiddleware: addMiddleware,
  // addTestRoutes: addTestRoutes,
  handleRequest: handleRequest,
  sendResponses: sendResponses,
  sendResponseToPlatform: sendResponseToPlatform,
  sendRequestAsReply: sendRequestAsReply,
  getContext: getContext
};
