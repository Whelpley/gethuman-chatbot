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

  //    yourapi.com/messenger  yourapi.com/slack

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

 // TO-DO: Remove .error(), replace with .done()
 //      wrap in try{}catch{}

 // can reference req.bot from incoming Post - set that in the context
 //   do this instead of piecing apart request to determine which bot
 //   also useful for veri
function handleRequest(botHandlers, actionHandlers, config) {
  return function (req, res) {
    var bot = req.params.bot;
    console.log('Incoming params: ' + req.params);
    // get context object from request/response/config that can be passed around
    var context = getContextFromReqRes(req, res, config);
    console.log('Context captured from request: ' + JSON.stringify(context));

    // figure out which bot handler to use based on the context
    var botHandler = factory.getBotHandler(botHandlers, context);
// instead:
// function getBotHandler(handlers, context) {
//  var handler = handlers[context.bot];

//  if (handler) {
//    return handler;
//  }
//  throw new Error('No bot handler for ' + context.bot);
// }
    // use the bot handler to translate the context into a generic request format
    // what do we want in generic request?
      // -message from platform
      // -sender ID
      // -status/type of request: is it a new message, a confirmation, ???


    var genericRequests = botHandler.translateRequestToGenericFormats(context);

// is this shorthand for:
    // genericRequests.forEach(function (genericRequest) {
      // ?
    genericRequests.forEach((genericRequest) => {

      // figure out which action handler to use based on the generic request
      // ex: if a confirmation message, returns No-Op actionhandler
      var actionHandler = factory.getActionHandler(actionHandlers, genericRequest);

      // use the action handler to process the request (i.e. call GH API, etc.)
      actionHandler.processRequest(genericRequest)
          .then(function (genericResponse) {
            //GR should have everything needed to talk to all platforms
            //    action type
            //
            console.log("Generic Response returned in Server: 2/2: ");
            // create payloads to be sent back to the platform from the generic response

            var payloads = botHandler.generateResponsePayloads(genericResponse);
            console.log("About to invoke sendResponse")
            // finally send the payloads back to the platform
            return sendResponse(genericResponse, payloads, botHandler);
          })
          .catch(function (err) {
            // generically send error response back to client
            // sendErrorResponse(err, context);
            botHandler.sendErrorResponse(err, context);
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
function sendResponse(genericResponse, payloads, botHandler) {

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
    bot: req.bot,
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
