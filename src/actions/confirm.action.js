'use strict'

var utilities = require('../brain/utilities');

function processRequest() {
    // send back a 200 response immediately
  utilities.preResponse(genericRequest.context);
    // do nothing
}

function noResponse() {
  return true;
};

module.exports = {
  processRequest: processRequest,
  noResponse: noResponse
};



