'use strict'

// should this just be declared in FB bot module?
// const token = process.env.FB_PAGE_ACCESS_TOKEN

module.exports = {
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest
}

// need to examine the request coming from Facebook for what distinguishes it
// basically returns False now
function isHandlerForRequest(platformRequestContext) {
  var responseUrl = platformRequestContext.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('facebook')) ? true : false;
}

function getResponsePayload() {

}

function sendResponseToPlatform() {

}

