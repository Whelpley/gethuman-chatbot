'use strict'

/**
 * Select Action Handler based on parameters of request-type flag
 * attached to generic Request
 *
 * @param actionHandlers
 * @param genericRequest
 * @return actionHandler
 */
function getActionHandler(actionHandlers, genericRequest) {
  // to refactor: separate Action Handlers by reqType
  var reqType = genericRequest.reqType;
  if ((reqType === 'user-input') || (reqType === 'postback') || (reqType === 'help')) {
    console.log('Receiving a user input');
    return actionHandlers && actionHandlers.length && actionHandlers[0];
  }
  else if (reqType === 'confirmation') {
    console.log('Receiving a confirmation message');
    return actionHandlers && actionHandlers.length && actionHandlers[1];
  };
}

/**
 * Select Bot Handler based on parameters of incoming Post
 *
 * @param botHandlers
 * @param context
 * @return handler
 */
function getBotHandler(botHandlers, context) {
 var handler = botHandlers[context.bot];
 if (handler) {
   console.log('Found bot handler for ' + context.bot + '!');
   return handler;
 }
 throw new Error('No bot handler for ' + context.bot);
}

module.exports = {
  getActionHandler: getActionHandler,
  getBotHandler: getBotHandler
};
