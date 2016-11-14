'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let request = require('request');
let Q = require('q');

let utilities = require('./utilities');
let factory = require('./factory');
let messenger = require('../bots/messenger.bot');
// let slack = require('../bots/slack.bot');

/**
 * Main entry point for the bot server
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 */
function start(botHandlers, actionHandlers, config, firebaseData) {
  let port = process.env.PORT || 3000;
  let app = express();

  console.log('Starting server');

  addMiddleware(app);

  // FB Messenger verification route
  app.get('/messenger', function(req, res) {
      messenger.verify(req, res);
  });

  // all bots go to this route
  app.post('/:bot', handleRequest(botHandlers, actionHandlers, config, firebaseData));
  // app.all('/:bot', handleRequest(botHandlers, actionHandlers, config));
    // look up Express - app.all - figure out how to process FBM verification
    // should be able to see if it's a Get or Post

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
 * Handle requests from the bots to our api
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 * @param config
 * @param firebaseData
 * @returns {Function}
 */
function handleRequest(botHandlers, actionHandlers, config, firebaseData) {
  return function(req, res) {
    console.log('Incoming request: ' + JSON.stringify(req.body));

    let context = getContext(req, res, config, firebaseData);
    // console.log('Context captured from request: ' + JSON.stringify(context));

    // send back a 200 response immediately
    context.finishResponse();

    let botHandler = factory.getBotHandler(botHandlers, context);

    let genericRequests = botHandler.translateRequestToGenericFormats(context);

    genericRequests.forEach((genericRequest) => {
      let actionHandler = factory.getActionHandler(actionHandlers, genericRequest);
      try {
        actionHandler.processRequest(genericRequest)
            .then(function(genericResponse) {
              // console.log("Generic Response returned in Server: " + genericResponse);
              let payloads = botHandler.generateResponsePayloads(genericResponse);
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
  }

  // force payloads into an array (is this necessary?)
  payloads = [].concat(payloads || []);
  let calls = payloads.map(function(payload) {
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
 * If so, passes it to Send function
 *
 * @param context
 * @param payload
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
    return sendRequestAsReply(payload);
  }
}

/**
 * Makes the request to send to payload
 *
 * @param payload
 * @return {Promise}
 */
function sendRequestAsReply(payload) {
  let deferred = Q.defer();
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  request(payload, function(error) {
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
 */
function getContext(req, res, config, firebaseData) {
  return {
    config: config,
    firebaseData: firebaseData,
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
  handleRequest: handleRequest,
  sendResponses: sendResponses,
  sendResponseToPlatform: sendResponseToPlatform,
  sendRequestAsReply: sendRequestAsReply,
  getContext: getContext
};
