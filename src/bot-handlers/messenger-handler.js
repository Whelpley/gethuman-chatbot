'use strict'

const token = process.env.FB_PAGE_ACCESS_TOKEN
const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh.js');
const postSearch = require('../services/post-api-gh.js');
const preparePayload = require('./messenger-payload.js');
const utilities = require('../services/utilities.js');

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

function getResponsePayload(context) {
  var messaging_events = context.userRequest.entry[0].messaging;
  // console.log("All messaging events: " + JSON.stringify(messaging_events));
  for (let i = 0; i < messaging_events.length; i++) {
    let event = context.userRequest.entry[0].messaging[i]
    console.log("Event detected: " + JSON.stringify(event));

    if (event.message && event.message.text) {
      let textInput = event.message.text;
      console.log("Text input received from user: " + textInput);
      var payload = {
        data:  {},
        context: context
      };

      // deprecated
      // this could be in a module, except for the nothingFound() fcn
      // return Q.all([
      //   postSearch.findByText(textInput),
      //   companySearch.findByText(textInput)
      // ])
      // .then(function (postAndCompanySearchResults) {
      //   var posts = postAndCompanySearchResults[0];
      //   var companies = postAndCompanySearchResults[1];
      //   if (posts && posts.length) {
      //     console.log("Found POSTS, loading payload");
      //     return preparePayload.addPostsToPayload(payload, posts);
      //   }
      //   else if (companies && companies.length) {
      //     console.log("Found COMPANIES, loading payload");
      //     return preparePayload.addCompaniesToPayload(payload, companies);
      //   }
      //   else {
      //     console.log("Found NOTHING, loading payload");
      //     return preparePayload.nothingFound(payload);
      //   }
      // });

      return Q.when(companySearch.findAllByText(textInput))
      .then(function (companySearchResults) {
        // console.log("Company Search Results: " + JSON.stringify(companySearchResults).substring(0,200));
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

        // capture other company names for later use
        var companyNames = companySearchResults.map(function(eachCompany) {
          return eachCompany.name;
        })
        // filter out the textInput from companyNames
        company.otherCompanies = companyNames.filter(function(name){
          return name.toLowerCase() !== textInput.toLowerCase();
        });
        console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

// needs a more clear name - change after removing deprecated functions
        return preparePayload.addPostsofCompanyToPayload(payload, company);
      });
    }
    // returning a blank object if no text input detected
    else {
      console.log("Non-text-input Post detected from FB");
      return Q.when({});
    }
  }
}

// Could be a common function, but refers to unique fcn
// attempting a clause to stop reponse & send nothing if non-text Post made from FB
function sendResponseToPlatform(payload) {
  console.log("About to process this payload for sending: " + JSON.stringify(payload));
  if (payload == {} | !payload) {
    return Q.when();
  }
  else if (payload.context && payload.context.isTest) {
    payload.context.sendResponse(payload);
    return Q.when();
  }
  else {
    return sendResponseWithNewRequest(payload);
  }
}

function sendResponseWithNewRequest(payload) {
  var deferred = Q.defer();
  var elements = payload.data;
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