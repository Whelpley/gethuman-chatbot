
let express = require('express');
let bodyParser = require('body-parser');
let request = require('request');
let Q = require('q');

let factory = require('./factory');
let messenger = require('../bots/messenger.bot');

/**
 * Main entry point for the bot server
 *
 * @param botHandlers
 * @param actionHandlers
 * @param config
 */
function start(botHandlers, actionHandlers, config, state) {
  let port = process.env.PORT || 3000;
  let app = express();

  addMiddleware(app);

  // Verification route for webhook to confirm new Facebook page
  app.get('/messenger', function(req, res) {
      messenger.verify(req, res);
  });

  // All other incoming Post requests go through here:
  app.post('/:bot', handleRequest(botHandlers, actionHandlers, config, state));

  // To-Do: route all requests (including FB verification) through:
  // app.all('/:bot', handleRequest(botHandlers, actionHandlers, config));

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
 * @param state
 * @returns {Function}
 */
function handleRequest(botHandlers, actionHandlers, config, state) {
  return function(req, res) {

    let context = getContext(req, res, config, state);

    // send back a 200 response immediately
    // (to satisfy communication protocols)
    context.finishResponse();

    let botHandler = factory.getBotHandler(botHandlers, context);

    let normalizedRequests = botHandler.normalizeRequests(context);

    normalizedRequests.forEach((normalizedRequest) => {
      let actionHandler = factory.getActionHandler(actionHandlers, normalizedRequest);

      Q.fcall(function() {
        return actionHandler.processRequest(normalizedRequest);
      })
      .then((genericResponse) => {
          let payloads = botHandler.generateResponsePayloads(genericResponse);
          return sendResponses(context, payloads);
        })
      .catch((error) => {
        console.log('Catching an error in Try/Catch in server: ' + error);
      });
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

  // Arrange payloads into an array if not already
  payloads = [].concat(payloads || []);

  let calls = payloads.map((payload) => {
    return function() {
      return sendResponseToPlatform(context, payload)
          .catch(function(err) {
            console.log('Error from send to platform: ' + err);
          });
    };
  });

  return chainPromises(calls);
}


/**
 * Chain promises together in a sequence
 *
 * @param calls Array of functions that return a promise
 * @param val Value to pass among chain
 * @return Promise from the end of the chain
 */
function chainPromises(calls, val) {
    if (!calls || !calls.length) {
        return Q.when(val);
    }
    return calls.reduce(Q.when, Q.when(val));
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
    context.sendResponse(payload);
    return Q.when();
  }

  if (!payload || (payload === {})) {
    return Q.when();
  }

  return sendRequestAsReply(payload);
}

/**
 * Makes the request to send to payload
 *
 * @param payload
 * @return {Promise}
 */
function sendRequestAsReply(payload) {
  let deferred = Q.defer();
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
function getContext(req, res, config, state) {
  return {
    config: config,
    state: state,
    userRequest: req.body,
    isTest: !!req.params.isTest,
    bot: req.params.bot,
    // is this even used anywhere?
    sendResponse: function(payload) {
      res.send(payload);
    },
    // is this even used anywhere?
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


