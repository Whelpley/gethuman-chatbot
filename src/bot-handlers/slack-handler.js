'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const prepareResponse = require('./slack-payload');
const utilities = require('../services/utilities');
// const config = require('../config/config');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

// Unique function, but repeated sub-functions
function getResponseObj(context) {
  var textInput = context.userRequest.text;
  var responseObj = {
    payloads:  [],
    context: context
  };
  if (!textInput) {
    return Q.when(prepareResponse.inputPrompt(responseObj));
  }
  return Q.when(companySearch.findAllByText(textInput))
  .then(function (companySearchResults) {
    // console.log("Company Search Results: " + JSON.stringify(companySearchResults).substring(0,200));
    var company = {};

    // separate out this as function - duplicated in all bots
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === textInput.toLowerCase();
    });

    if (!companySearchResults.length) {
      console.log("Nothing found in initial Company search");
      return prepareResponse.nothingFound(responseObj);
    }
    else if (exactMatch && exactMatch.length) {
      company = exactMatch[0];
      console.log("Found an exact match from Companies search");
    }
    else {
      company = companySearchResults[0];
      console.log("Going with first result from Companies search");
    };

    var companyNames = companySearchResults.map(function(eachCompany) {
      return eachCompany.name;
    })
    // filter out the textInput
    company.otherCompanies = companyNames.filter(function(name){
      return name.toLowerCase() !== textInput.toLowerCase();
    });
    console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

    return prepareResponse.loadCompanyToObj(responseObj, company);
  });
}

// Repeated function
function sendResponseToPlatform(payload, context) {
  if (context.isTest) {
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
  var path = process.env.INCOMING_WEBHOOK_PATH;
  // var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.channel = context.userRequest.channel_id;

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

// duplicated function - export to module!
function sendErrorResponse(err, context) {
  console.log("Ran into an error: " + err);
  var payload = prepareResponse.error(err);
  sendRequestsAsReply(payload, context);
}

// not needed?
// will delete this if won't cause problems when missing
function verify() {
  console.log("Nothing to see here.")
}

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponseObj: getResponseObj,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse,
  verify: verify
}
