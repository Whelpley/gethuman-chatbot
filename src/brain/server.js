'use strict'

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var utilities = require('./utilities');
var factory = require('./factory');

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

    //    yourapi.com/messenger  yourapi.com/gethuman - slack

  // FB version (switch facebook to just /gethuman)
  // app.post('/v3/gethuman', handleRequest(botHandlers, actionHandlers));

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

  app.use(function (err, req, res) {
    console.error(err.stack);
    res.status(400).send(err.message);
  });
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

    // get context object from request/response/config that can be passed around
    var context = getContextFromReqRes(req, res, config);

    // figure out which bot handler to use based on the context
    var botHandler = factory.getBotHandler(botHandlers, context);

    // use the bot handler to translate the context into a generic request format
    var genericRequests = botHandler.translateRequestToGenericFormats(context);

// is this shorthand for:
    // genericRequests.forEach(function (genericRequest) {
      // ?
    genericRequests.forEach((genericRequest) => {

      // figure out which action handler to use based on the generic request
      var actionHandler = factory.getActionHandler(actionHandlers, genericRequest);

      // use the action handler to process the request (i.e. call GH API, etc.)
      actionHandler.processRequest(genericRequest)
          .then(function (genericResponse) {
            console.log("Action Handler has returned Generic Response, about to send to Bot Handler to process into payloads.");
            // create payloads to be sent back to the platform from the generic response
            var payloads = botHandler.generateResponsePayloads(genericResponse);
            console.log("About to invoke sendResponse")
            // finally send the payloads back to the platform
            return sendResponse(genericResponse, payloads);
          })
          .catch(function (err) {

            // generically send error response back to client
            sendErrorResponse(err, context);
          });
    });

  }
}

/**
 * This function should be the exact same each and every time
 *
 * @param genericResponse
 * @param payloads
 * @returns {Promise}
 */
function sendResponse(genericResponse, payloads) {

  // may not be necessary.... already is an array
  payloads = [].concat(payloads || []);
  var context = genericResponse.context;
  // make an array of call functions
  var calls = payloads.map(function (payload) {
    return function () {
      // for now:
      return botHandler.sendResponseToPlatform(payload, context)
          .catch(function (err) {
            console.log('err is ' + err);
          });

      // TO-DO: do generic way of sending to platform
    }
  });

  return utilities.chainPromises(calls);
}

/**
 * Create a generic context object from the Express
 * request and response objects
 *
 * @param req
 * @param res
 * @param config
 */
function getContextFromReqRes(req, res, config) {
  return {
    config: config,
    userRequest: req.body,
    isTest: !!req.params.isTest,
    sendResponse: function (payload) {
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
  addTestRoutes: addTestRoutes,
  handleRequest: handleRequest,
  getContextFromReqRes: getContextFromReqRes
};
