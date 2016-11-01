'use strict'

/**
 * Select Action Handler based on parameters of request-type flag
 * attached to generic Request
 *
 * @param actionHandlers
 * @param genericRequest
 * @returns actionHandler
 */
function getActionHandler(actionHandlers, genericRequest) {
  // can examine genericRequest.reqType to see
  if ((genericRequest.reqType === 'user-input') || (genericRequest.reqType === 'postback')) {
    console.log('Receiving a user input');
    return actionHandlers && actionHandlers.length && actionHandlers[0];
  }
  else if (genericRequest.reqType === 'confirmation') {
    console.log('Receiving a confirmation message');
    return actionHandlers && actionHandlers.length && actionHandlers[1];
  };
}

/**
 * Select Bot Handler based on parameters of incoming Post
 *
 * @param botHandlers
 * @param context
 * @returns handler
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
