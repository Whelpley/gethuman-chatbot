'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const prepareResponse = require('./slack-payload');
const utilities = require('../services/utilities');
const config = require('../config/config');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

// // Unique function, but repeated sub-functions
// function getResponseObj(context) {
//   var textInput = context.userRequest.text;
//   var responseObj = {
//     payloads:  [],
//     context: context
//   };
//   if (!textInput) {
//     return Q.when(prepareResponse.inputPrompt(responseObj));
//   }
//   // repeat function
//   return Q.when(companySearch.findAllByText(textInput))
//   .then(function (companySearchResults) {
//     // console.log("Company Search Results: " + JSON.stringify(companySearchResults).substring(0,200));
//     var company = {};

//     // separate out this as function - duplicated in all bots
//     var exactMatch = companySearchResults.filter(function(eachCompany) {
//       return eachCompany.name.toLowerCase() === textInput.toLowerCase();
//     });

//     if (!companySearchResults.length) {
//       console.log("Nothing found in initial Company search");
//       return prepareResponse.nothingFound(responseObj);
//     }
//     else if (exactMatch && exactMatch.length) {
//       company = exactMatch[0];
//       console.log("Found an exact match from Companies search");
//     }
//     else {
//       company = companySearchResults[0];
//       console.log("Going with first result from Companies search");
//     };

//     // mini-duplicated function
//     var companyNames = companySearchResults.map(function(eachCompany) {
//       return eachCompany.name;
//     })
//     // filter out the textInput
//     company.otherCompanies = companyNames.filter(function(name){
//       return name.toLowerCase() !== textInput.toLowerCase();
//     });
//     console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

//     return prepareResponse.loadCompanyToObj(responseObj, company);
//   });
// }

// not needed?
// will delete this if won't cause problems when missing
function verify() {
  console.log("Nothing to see here.")
}

// ------------ New Version Code! --------------

// what needs to be known before processing?
function translateRequestToCommonFormat(context) {
  return {
    userInput: context.userRequest.text,
    context: context
  };
}

function translateCommonResponseToPlatform(commonResponse) {
// need if/else depending on type - right now only handles standard input
  var botSpecificResponse = {
    payloads:  [],
    context: commonResponse.context
  }

  var name = commonResponse.data.name;
  var posts = commonResponse.data.posts;
  var otherCompanies = commonResponse.data.otherCompanies;
  var colors = utilities.colors;

  var contactInfo = utilities.extractContactInfo(company);
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
  // ... needs other company contact methods
  payloads[0].attachments.push({
      "fallback": "Contact info for " + name,
      "title": "Best ways to contact " + name + ":",
      "color": '#999999',
      "text": topContacts,
  });

  // attach Other Companies info if they exist
  if (otherCompanies && otherCompanies.length) {
      var otherCompaniesList = utilities.convertArrayToBoldList(otherCompanies);
      console.log("Converted Other Companies list: " + otherCompaniesList);
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
  else if (!payload || (payload === [])) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    return sendRequestsAsReply(payload, context);
  }
}

// unique function
function sendRequestsAsReply(payload, context) {
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  var deferred = Q.defer();
  // var path = process.env.INCOMING_WEBHOOK_PATH;
  var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.channel = context.userRequest.channel_id;

// eventually want to send this as the response to original request
  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
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
