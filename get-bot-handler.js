var handlers = [require('./slack-handler'), require('./messenger-handler')];

module.exports = {
  getBotHandler: getBotHandler
}

function getBotHandler(platformRequestContext) {
  // loop through handlers and call handlers[i].isHandlerForRequest(platformRequestContext)

  for (let i = 0; i < handlers.length; i++) {
    if (handlers[i].isHandlerForRequest(platformRequestContext)) {
      console.log("Found a bot to handle request!");
      return handlers[i];
    };
  };

  // else if handler not found, throw error
  throw "Request coming from unrecognized platform";
}