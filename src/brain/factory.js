
/**
 * Select Action Handler based on parameters of request-type flag
 * attached to generic Request
 *
 * @param actionHandlers
 * @param genericRequest
 * @return actionHandler
 */
function getActionHandler(actionHandlers, normalizedRequest) {

  let reqType = normalizedRequest.reqType;

  if ((reqType === 'user-input') || (reqType === 'postback') || (reqType === 'help') || (reqType === 'greeting')) {
    return actionHandlers && actionHandlers.length && actionHandlers[0];
  }

  if (reqType === 'ignore') {
    return actionHandlers && actionHandlers.length && actionHandlers[1];
  }

}

/**
 * Select Bot Handler based on parameters of incoming Post
 *
 * @param botHandlers
 * @param context
 * @return handler
 */
function getBotHandler(botHandlers, context) {
 let handler = botHandlers[context.bot];

 if (handler) {
   return handler;
 }

 throw new Error('No bot handler for ' + context.bot);
}

module.exports = {
  getActionHandler: getActionHandler,
  getBotHandler: getBotHandler
};
