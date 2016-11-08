const Q = require('q');

/**
 * Processes a Confirmation message - sends 200, returns False boolean
 *
 * @param genericRequest
 * @return {Promise}
 */
function processRequest(genericRequest) {
  return Q.when(false);
}

module.exports = {
  processRequest: processRequest
};
