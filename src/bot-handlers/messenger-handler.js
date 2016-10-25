'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const prepareResponse = require('./messenger-payload');
const utilities = require('../services/utilities');
const config = require('../config/config');
// new config vars!

const token = config.FB_PAGE_ACCESS_TOKEN;
// const token = process.env.facebookAccessToken;

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

// Unique function, but repeated sub-functions
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

    // repeat function
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
        return prepareResponse.loadCompanyToObj(responseObj, company);
      });
    }
    // returning a blank object if no text input detected
    else {
      console.log("Non-text-input Post detected from FB");
      return Q.when(responseObj);
    }
  }
}

// duplicate fcn in ./slack-handler (almost) - candidate for module
function sendResponseToPlatform(payload, context) {
  // console.log("About to process this payload for sending: " + JSON.stringify(payload).substring(0,400));

  if (!!context.isTest) {
    console.log("Test flag detected in payload context.");
    // triggers inherent Response function from context - not working
    // (should it send anything at all?)
    context.sendResponse(payload);
    // context.finishResponse();
    return Q.when();
  }
  else if (!payload || (payload === [])) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    console.log("Standard data-having payload detected, sending a response");
    // when coming from Error, stops here....
    return sendRequestsAsReply(payload, context);
  }
}

// unique function
function sendRequestsAsReply(payload, context) {
  console.log("Last step before sending this payload: " + JSON.stringify(payload));
  var deferred = Q.defer();
  var sender = context.userRequest.entry[0].messaging[0].sender.id;
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
                        "elements": payload
                    }
                }
            },
        }
    }, function(error, response, body) {
      // console.log('Response from our request: ' + JSON.stringify(response));
      console.log('Body of response from our request: ' + JSON.stringify(body));

      if (error) {
        console.log('Error from our request: ' + JSON.stringify(error));
        deferred.reject(error);
      }
      else {
        deferred.resolve();
      }
    });

  return deferred.promise;
}

// duplicated in Slack/etc? export to module!
// points to different send function though
function sendErrorResponse(err, context) {
  console.log("Ran into an error: " + err);
  var payload = prepareResponse.error(err);
  sendRequestsAsReply(payload, context);
}

function verify(req, res) {
    console.log("Receiving webhook verification from FB.")
    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

module.exports = {
  getResponseObj: getResponseObj,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest,
  sendErrorResponse: sendErrorResponse,
  verify: verify
}