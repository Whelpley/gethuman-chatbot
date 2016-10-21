'use strict'

// should the below functions exist in another module?

// is unit testable
function getBotHandler(handlers, context) {
  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].isHandlerForRequest(context)) {
      console.log("Found a bot to handle request: # " + i + " in handlers");
      return handlers[i];
    };
  };
  // else if handler not found, throw error
  throw "Request coming from unrecognized platform";
}

// not yet in use
function getActionHandler(actionHandlers) {
  return actionHandlers && actionHandlers.length && actionHandlers[0];
}

module.exports = {
  getBotHandler: getBotHandler,
  getActionHandler: getActionHandler
};
