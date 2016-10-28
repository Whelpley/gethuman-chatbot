'use strict'

const request = require('request');
const Q = require('q');
const utilities = require('../services/utilities');
const config = require('../config/config');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

// not needed?
// will delete this if won't cause problems when missing
function verify() {
  console.log("Nothing to see here.")
}

// what needs to be known before processing?
// should this extract more from the context rather than keep passing it around?{}
function translateRequestToCommonFormat(context) {
  var commonRequest = {
    context: context
  };
  var text = context.userRequest.text
  if (text) {
    commonRequest.userInput = text;
  }
  return commonRequest;
}

function translateCommonResponseToPlatform(commonResponse) {
  var botSpecificResponse = {
    payloads:  [],
    context: commonResponse.context
  }

// Case: no user input
  if (!commonResponse.data) {
    // is this the right way to load the payload?
    botSpecificResponse.payloads.push([{
        username: 'GetHuman',
        text: "Tell me the company you would like to contact.",
        response_type: 'ephemeral',
        icon_emoji: ':gethuman:'
    }]);
    return botSpecificResponse;
  }
// Case: nothing returned from Companies search
  else if (commonResponse.data === {}) {
    var textInput = commonResponse.context.userRequest.text;
    botSpecificResponse.payloads = [{
        username: 'GetHuman',
        text: "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")",
        icon_emoji: ':gethuman:',
        response_type: 'ephemeral'
    }];
    return botSpecificResponse;
  }

  var name = commonResponse.data.name;
  var posts = commonResponse.data.posts;
  var otherCompanies = commonResponse.data.otherCompanies;
  var colors = utilities.colors;

  var contactInfo = utilities.extractContactInfo(commonResponse.data);
  var topContacts = utilities.formatTextFieldSlack(contactInfo);

  var payloads = [{
    // may not need to set these
      username: 'GetHuman',
      icon_emoji: ':gethuman:',
      // set response_type to 'in_channel' if we want all to see it
      // doesn't work like that though!
      response_type: 'ephemeral',
      attachments: []
  }];

// get payload-loaders into sub-functions for testing
  if (posts && posts.length) {
      payloads[0].text = "Top issues for " + name + ":";
      for (let i = 0; i < posts.length; i++) {
          let title = posts[i].title || '';
          let urlId = posts[i].urlId || ''
          let color = colors[i];
          let singleAttachment = {
              "fallback": "Issue for " + name,
              "title": title,
              "color": color,
              "fields": [
                  {
                      "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve this for me - $20>",
                      "short": true
                  },
                  {
                      "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|More info ...>",
                      "short": true
                  }
              ]
          };
          payloads[0].attachments.push(singleAttachment);
      };
  }

  // attach Company contact info:
  payloads[0].attachments.push({
      "fallback": "Contact info for " + name,
      "title": "Best ways to contact " + name + ":",
      "color": '#999999',
      "text": topContacts,
  });

  // attach Other Companies info if they exist
  if (otherCompanies && otherCompanies.length) {
      var otherCompaniesList = utilities.convertArrayToBoldList(otherCompanies);
      payloads[0].attachments.push({
          "fallback": "Other solutions",
          "title": "Were you talking about " + name + "?",
          "color": '#BBBBBB',
          "text": "Or maybe you meant " + otherCompaniesList + "?",
          "mrkdwn_in": ["text"]
      });
  }

  if (!payloads[0].attachments.length) {
      payloads[0].text = "I couldn't find anything for \"" + name + "\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")"
  }

  botSpecificResponse.payloads = payloads;
  return botSpecificResponse;
}

function sendResponseToPlatform(payload, context) {
  if (context.isTest) {
    console.log("Test flag detected in payload context.");
    context.sendResponse(payload);
    return Q.when();
  }
  // if this part needed?
  else if (!payload || (payload === [])) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    return sendRequestAsReply(payload, context);
  }
}

// unique function

function sendRequestAsReply(payload, context) {
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  var deferred = Q.defer();
  var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;

// should this be extracted elsewhere? Any other reason to keep context this far?
  payload[0].channel = context.userRequest.channel_id;

// eventually want to send this as the response to original request
  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload[0])
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
        username: 'GetHuman',
        text: error,
        icon_emoji: ':gethuman:'
  };
  sendRequestsAsReply(payload, context);
}

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse,
  verify: verify,
  translateRequestToCommonFormat: translateRequestToCommonFormat,
  translateCommonResponseToPlatform: translateCommonResponseToPlatform
}
