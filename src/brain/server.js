'use strict'

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
  addTestRoutes(app);

  // all bots go to this route
  app.post('/:bot', handleRequest(botHandlers, actionHandlers, config));

  // FB Messenger verification route
  app.get('/messenger', function(req, res) {
    messenger.verify(req, res));
  };

  app.listen(port, function () {
    console.log('API listening for bots on port ' + port);
  });
}

/**
 * Add Express middleware
 *
 * @param app The express server
 */
function addMiddleware(app) {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

// what does this do - returns an error: "res.status is not a function"
// to be deleted?
  // app.use(function (err, req, res) {
  //   console.error(err.stack);
  //   res.status(400).send(err.message);
  // });
}

/**
 * Add test routes (remove in the future)
 *
 * @param app The express server
 */
function addTestRoutes(app) {

  // test route
  app.get('/', function (req, res) {
    res.status(200).send('Hello world!')
  });

  // Slack hellobot - keep for testing
  app.post('/hello', require('../deprecated/hellobot.js'));
  // Slack dicebot - keep for testing
  app.post('/roll', require('../deprecated/dicebot.js'));
}

/**
 * Handle requests from the bots to our api
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 * @returns {Function}
 */
function handleRequest(botHandlers, actionHandlers, config) {
  return function (req, res) {
    var context = getContext(req, res, config);
    console.log('Context captured from request: ' + JSON.stringify(context));

    var botHandler = getBotHandler(botHandlers, context);
    var genericRequests = botHandler.translateRequestToGenericFormats(context);

    genericRequests.forEach((genericRequest) => {
      var actionHandler = factory.getActionHandler(actionHandlers, genericRequest);
      try {
        // use the action handler to process the request (i.e. call GH API, etc.)
        actionHandler.processRequest(genericRequest)
            .then(function (genericResponse) {
              console.log("Generic Response returned in Server: " + JSON.stringify(genericResponse).substring(0,200));
              // payloads now have entire Request objects
              var payloads = botHandler.generateResponsePayloads(genericResponse);
              console.log("Payloads generated: " + JSON.stringify(payloads));
              return sendResponses(context, payloads);
            })
            .done();
      }
      catch(error) {
        console.log('Catching an error in Try/Catch in server: ' + error);
      }
    });

  }
}

/**
 * This function should be the exact same each and every time
 *
 * @param context
 * @param payloads
 * @returns {Promise}
 */
function sendResponses(context, payloads) {
  // force payloads into an array (is this necessary?)
  payloads = [].concat(payloads || []);
  var calls = payloads.map(function (payload) {
    return function () {
      return sendResponseToPlatform(context, payload)
          .catch(function (err) {
            console.log('Error from send to platform: ' + err);
          });
    }
  });
  return utilities.chainPromises(calls);
}

// Checks to see if payload should actually be sent to a platform, or other action
function sendResponseToPlatform(context, payload) {
  if (context.isTest) {
    console.log("Test flag detected in payload context.");
    context.sendResponse(payload);
    return Q.when();
  }
  // if this part needed?
  else if (!payload || (payload === {})) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    return sendRequestAsReply(payload, context);
  }
}

function sendRequestAsReply(payload, context) {
  var deferred = Q.defer();
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  request(payload, function (error, response, body) {
    if (error) {
      console.log("Ran into error while making request to send Slack payload: " + error);
      deferred.reject(error);
    }
    else {
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
    sendResponse: function (payload) {
      res.send(payload);
    },
    finishResponse: function() {
      res.status(200).end();
    }
  };
}

/**
 * Select Bot Handler based on parameters of incoming Post
 *
 * @param handlers
 * @param context
 * @returns handler
 */
function getBotHandler(handlers, context) {
 var handler = handlers[context.bot];
 if (handler) {
   console.log('Found bot handler for ' + context.bot + '!');
   return handler;
 }
 throw new Error('No bot handler for ' + context.bot);
}

module.exports = {
  start: start,
  addMiddleware: addMiddleware,
  addTestRoutes: addTestRoutes,
  handleRequest: handleRequest,
  getContext: getContext
};
