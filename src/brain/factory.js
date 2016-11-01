'use strict'

function getActionHandler(actionHandlers, genericRequest) {
  // can examine genericRequest.reqType to see
  // use switch statement if reqTypes become many
  if ((genericRequest.reqType === 'user-input') || (genericRequest.reqType === 'postback')) {
    console.log('Receiving a user input');
    return actionHandlers && actionHandlers.length && actionHandlers[0];
  }
  else if (genericRequest.reqType === 'confirmation') {
    console.log('Receiving a confirmation message');
    return actionHandlers && actionHandlers.length && actionHandlers[1];
  };
}

module.exports = {
  getActionHandler: getActionHandler
};
