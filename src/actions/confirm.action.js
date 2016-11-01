'use strict'

var utilities = require('../brain/utilities');
var Q = require('q');

// processing a Confirmation message - sends 200, does nothing else
function processRequest(genericRequest) {
  utilities.preResponse(genericRequest.context);
  return Q.when(false);
}

module.exports = {
  processRequest: processRequest
};



