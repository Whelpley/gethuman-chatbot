'use strict'

var utilities = require('../brain/utilities');
var Q = require('q');

/**
 * Processes a Confirmation message - sends 200, returns False boolean
 *
 * @param genericRequest
 * @return {Promise}
 */
function processRequest(genericRequest) {
  utilities.preResponse(genericRequest.context);
  return Q.when(false);
}

module.exports = {
  processRequest: processRequest
};
