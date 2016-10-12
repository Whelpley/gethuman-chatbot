'use strict'

module.exports = {
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest
}

// need to examine the request coming from Facebook for what distinguishes it
// basically returns False now
function isHandlerForRequest(platformRequestContext) {
  var responseUrl = platformRequestContext.userRequest.response_url || '';

  if (responseUrl && responseUrl.includes('facebook')) {
    return true;
  } else {
    return false;
  }
}

function getResponsePayload() {

}

function sendResponseToPlatform() {

}


