'use strict'

var utilities = require('../brain/utilities');
var Q = require('q');


function processRequest(genericRequest) {
  utilities.preResponse(genericRequest.context);
  return Q.when(false);
}

module.exports = {
  processRequest: processRequest
};



