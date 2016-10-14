'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../api-gh/company.js');
const postSearch = require('../api-gh/post.js');
const preparePayload = require('./slack-payload.js');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

function getResponsePayload(context) {
  var textInput = context.userRequest.text;
  var payload = {
    raw: {},
    data:  {},
    context: context
  }
  if (!textInput) {
      return Q.when(preparePayload.inputPrompt(payload));
  }
  console.log('About to search API for input: ' + textInput);
  return Q.all([
      postSearch.findByText(textInput),
      companySearch.findByText(textInput)
  ])
  .then(function (postAndCompanySearchResults) {
    console.log('About to load payload object from search results');
    var posts = postAndCompanySearchResults[0];
    var companies = postAndCompanySearchResults[1];

    if (posts && posts.length) {
      return preparePayload.addPostsToPayload(payload, posts);
    }
    else if (companies && companies.length) {
      return preparePayload.addCompaniesToPayload(payload, companies);
    }
    else {
      return preparePayload.nothingFound(payload);
    }
  });
}


// does it need to wrap up with 'res.status(200).end()' at end? Yes it does!
function sendResponseToPlatform(payload) {
  // shoot back an immediate Status 200 to let Slack know it's all cool
  payload.context.finishResponse();

  var deferred = Q.defer();
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.data.channel = payload.context.userRequest.channel_id;
  // console.log("Payload about to be sent back to Slack: " + JSON.stringify(payload.data));
  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload.data)
  }, function (error, response, body) {
    if (error) {
      deferred.reject(error);
    }
    else {
      deferred.resolve();
    }
  });
  return deferred.promise;
}

function sendErrorResponse(err, context) {
  console.log("Ran into an error: " + err);
  var payload = {
    // raw: {},
    data: {},
    context: context
  };
  payload.data = preparePayload.error(err);
  sendResponseToPlatform(errorPayload);
}

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse
}
