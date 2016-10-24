'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const preparePayload = require('./messenger-payload');
const utilities = require('../services/utilities');
// const config = require('../config/config');

const token = process.env.FB_PAGE_ACCESS_TOKEN;
// const token = process.env.facebookAccessToken;

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

function getResponseObj(context) {
  var messaging_events = context.userRequest.entry[0].messaging;
  // console.log("All messaging events: " + JSON.stringify(messaging_events));
  for (let i = 0; i < messaging_events.length; i++) {
    var event = context.userRequest.entry[0].messaging[i];
    var responseObj = {
      payloads:  [],
      context: context
    };
    console.log("Event detected: " + JSON.stringify(event));

    if (event.message && event.message.text) {
      let textInput = event.message.text;
      console.log("Text input received from user: " + textInput);
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
          return preparePayload.nothingFound(responseObj);
        }
        else if (exactMatch && exactMatch.length) {
          company = exactMatch[0];
          console.log("Found an exact match from Companies search: " + JSON.stringify(exactMatch[0]).substring(0,200));
        }
        else {
          company = companySearchResults[0];
          console.log("Going with first result from Companies search: " + JSON.stringify(company).substring(0,200));
        };

        // capture other company names for later use
        var companyNames = companySearchResults.map(function(eachCompany) {
          return eachCompany.name;
        })
        // filter out the textInput from companyNames
        company.otherCompanies = companyNames.filter(function(name){
          return name.toLowerCase() !== textInput.toLowerCase();
        });
        console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

        // will format responseObj.payloads according to Company contents
        return preparePayload.addPostsofCompanyToObj(responseObj, company);
      });
    }
    // returning a blank object if no text input detected
    else {
      console.log("Non-text-input Post detected from FB");
      return Q.when(responseObj);
    }
  }
}

// Could be a common function, but refers to unique fcn
// attempting a clause to stop reponse & send nothing if non-text Post made from FB
// duplicate fcn in ./slack-handler
function sendResponseToPlatform(payload) {
  console.log("About to process this payload for sending: " + JSON.stringify(payload).substring(0,400));

  if (!!payload.context && !!payload.context.isTest) {
    console.log("Test flag detected in payload context.");
    payload.context.sendResponse(payload);
    return Q.when();
  }
  else if (!payload.data || (payload.data === {})) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    console.log("Standard data-having payload detected.");
    return sendRequestsAsReply(payload);
  }
}

function sendRequestsAsReply(payload) {
  var deferred = Q.defer();
  var elements = payload.data.postElements || [];
  var sender = payload.context.userRequest.entry[0].messaging[0].sender.id;
  // console.log("Sender: " + sender);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            },
        }
    }, function(error, response, body) {
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
    data: preparePayload.error(err),
    context: context
  };
  sendResponseToPlatform(payload)
}

function verify(req, res) {
    console.log("Receiving webhook verification from FB.")
    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

module.exports = {
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest,
  sendErrorResponse: sendErrorResponse,
  verify: verify
}