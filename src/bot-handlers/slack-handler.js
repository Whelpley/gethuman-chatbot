'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const preparePayload = require('./slack-payload');
const utilities = require('../services/utilities');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

function getResponsePayload(context) {
  var textInput = context.userRequest.text;
  var payload = {
    data:  {},
    context: context
  }
  if (!textInput) {
      return Q.when(preparePayload.inputPrompt(payload));
  }
  return Q.when(companySearch.findAllByText(textInput))
  .then(function (companySearchResults) {
    console.log("Company Search Results: " + JSON.stringify(companySearchResults).substring(0,200));
    var company = {};
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === textInput.toLowerCase();
    });

    if (!companySearchResults.length) {
      console.log("Nothing found in initial Company search");
      return preparePayload.nothingFound(payload);
    }
    else if (exactMatch && exactMatch.length) {
      company = exactMatch[0];
      console.log("Found an exact match from Companies search: " + JSON.stringify(exactMatch[0]).substring(0,200));
    }
    else {
      company = companySearchResults[0];
      console.log("Going with first result from Companies search: " + JSON.stringify(company).substring(0,200));
    };

    // will need to capture other company names for later use
    var companyNames = companySearchResults.map(function(eachCompany) {
      return eachCompany.name;
    })
    // filter out the textInput
    // console.log("Other companies returned from search: " + JSON.stringify(companyNames));
    company.otherCompanies = companyNames.filter(function(name){
      return name.toLowerCase() !== textInput.toLowerCase();
    });
    console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

    return preparePayload.addPostsofCompanyToPayload(payload, company);
  });
}

// Old version
// function getResponsePayload(context) {
//   var textInput = context.userRequest.text;
//   var payload = {
//     data:  {},
//     context: context
//   }
//   if (!textInput) {
//       return Q.when(preparePayload.inputPrompt(payload));
//   }
//   // this could be in a module, except for the nothingFound() fcn
//   return Q.all([
//     postSearch.findByText(textInput),
//     companySearch.findByText(textInput)
//   ])
//   .then(function (postAndCompanySearchResults) {
//     var posts = postAndCompanySearchResults[0];
//     var companies = postAndCompanySearchResults[1];
//     if (posts && posts.length) {
//       return preparePayload.addPostsToPayload(payload, posts);
//     }
//     else if (companies && companies.length) {
//       return preparePayload.addCompaniesToPayload(payload, companies);
//     }
//     else {
//       return preparePayload.nothingFound(payload);
//     }
//   });
// }

// Could be a common function, but refers to unique fcn
function sendResponseToPlatform(payload) {
  if (payload.context.isTest) {
    payload.context.sendResponse(payload);
    return Q.when();
  }
  else {
    return sendResponseWithNewRequest(payload);
  }
}

function sendResponseWithNewRequest(payload) {
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
    data: {},
    context: context
  };
  payload.data = preparePayload.error(err);
  sendResponseToPlatform(payload);
}

// not needed?
// will delete this if won't cause problems when missing
function verify() {
  console.log("Nothing to see here.")
}

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse,
  verify: verify
}
