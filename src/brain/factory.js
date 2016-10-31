'use strict'

// not yet in use
function getActionHandler(actionHandlers, genericRequest) {
  // what is getting filtered out here?
  if (genericRequest) {

  }
  return actionHandlers && actionHandlers.length && actionHandlers[0];
}

module.exports = {
  getActionHandler: getActionHandler
};
