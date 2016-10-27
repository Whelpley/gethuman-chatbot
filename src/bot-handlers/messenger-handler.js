'use strict'

const request = require('request');
const Q = require('q');
const postSearch = require('../services/post-api-gh');
const prepareResponse = require('./messenger-payload');
const utilities = require('../services/utilities');
const config = require('../config/config');

const token = config.facebookAccessToken;

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

// // Unique function, but repeated sub-functions
// function getResponseObj(context) {
//   var messaging_events = context.userRequest.entry[0].messaging;
//   // console.log("All messaging events: " + JSON.stringify(messaging_events));
//   for (let i = 0; i < messaging_events.length; i++) {
//     var event = context.userRequest.entry[0].messaging[i];
//     var responseObj = {
//       payloads:  [],
//       context: context
//     };
//     console.log("Event detected: " + JSON.stringify(event));

//     if (event.message && event.message.text) {
//       let textInput = event.message.text;
//       responseObj.context.textInput = textInput;
//       console.log("Text input received from user: " + textInput);
//       return summonResponse(responseObj, textInput);
//     }
//     else if (event.postback) {
//       let textInput = event.postback.payload;
//       responseObj.context.textInput = textInput;
//       console.log("Text input received from postback: " + textInput);
//       return summonResponse(responseObj, textInput);
//     }
//     else {
//       console.log("Non-text-input Post detected from FB");
//       return Q.when(responseObj);
//     }
//   }
// }

// function summonResponse(responseObj, textInput) {
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

//     // capture other company names for later use
//     var companyNames = companySearchResults.map(function(eachCompany) {
//       return eachCompany.name;
//     })
//     // filter out the textInput from companyNames
//     company.otherCompanies = companyNames.filter(function(name){
//       return name.toLowerCase() !== textInput.toLowerCase();
//     });
//     console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

//     // will format responseObj.payloads according to Company contents
//     return prepareResponse.loadCompanyToObj(responseObj, company);
//   });
// }



// duplicated in Slack/etc? export to module!
// points to different send function though
function sendErrorResponse(err, context) {
  console.log("Ran into an error: " + err);
  var payload = [{
        "title": "We ran into an error!",
        "subtitle": JSON.stringify(error),
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman"
        }],
    }];
  sendRequestsAsReply(payload, context);
}

// no working just yet
function verify(req, res) {
    console.log("Receiving webhook verification from FB.");
    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

//------------------ New Code ------------------

function translateRequestToCommonFormat(context) {
  var commonRequest = {
    context: context
  };
  var messaging_events = context.userRequest.entry[0].messaging;
  for (let i = 0; i < messaging_events.length; i++) {
    var event = context.userRequest.entry[0].messaging[i];
    if (event.message && event.message.text) {
      commonRequest.userInput = event.message.text;
      // cheating! tacking on the Text input in a new place to find it later
      commonRequest.context.textInput = commonRequest.userInput;
      return commonRequest;
    }
    else if (event.postback) {
    // Later: determine if this is triggering a new search, or displaying more Companies - right now just triggers new search
      commonRequest.userInput = event.postback.payload;
      return commonRequest;
    }
    else {
      console.log("Non-text-input Post detected from FB");
      return null;
    }
  }
}

function translateCommonResponseToPlatform(commonResponse) {
  var botSpecificResponse = {
    payloads:  [],
    context: commonResponse.context
  }

  // Case: nothing returned from Companies search
  if (commonResponse.data === {}) {
    var textInput = commonRequest.context.textInput;
    botSpecificResponse.payloads.push([{
        "title": "Nothing found!",
        "subtitle": "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")",
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman"
        }],
    }]);
    return botSpecificResponse;
  }

  var payloads = [];
  var name = commonResponse.data.name;
  var posts = commonResponse.data.posts;
  var otherCompanies = commonResponse.data.otherCompanies;
  var contactInfo = utilities.extractContactInfo(commonResponse.data);

  if (posts && posts.length) {
  // if Posts exist, send Post info cards
    var postElements = [];
    for (let i = 0; i < posts.length; i++) {
      let text = posts[i].title || '';
      let urlId = posts[i].urlId || ''
      let singleElement = {
          "title": "Top issues for " + name + ", #" + (i+1) + " of " + posts.length + ":",
          "subtitle": text,
          "buttons": [{
              "type": "web_url",
              "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
              "title": "Solve this for Me - $20"
          },
          {
              "type": "web_url",
              "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
              "title": "More info ..."
          }],
      };
      postElements.push(singleElement);
    }
    payloads.push(postElements);
  }

  // make Company Info Card
  var companyInfoElement = [{
      "title": "Best ways to contact " + name + ":",
      // this should live in this file
      'buttons': utilities.formatContactButtonsMessenger(contactInfo)
  }];
  if (contactInfo.email) {
      companyInfoElement[0].subtitle = contactInfo.email;
  };
  // only push in if at least one button exists:
  if (companyInfoElement[0].subtitle || companyInfoElement[0].buttons.length) {
      payloads.push(companyInfoElement);
  };

  // make Other Companies Card
  // To-Do: Make buttons trigger a Postback to do another search/reply
  if (otherCompanies && otherCompanies.length) {
      var otherCompaniesElement = [{
          "title": "Were you trying to reach " + name + "?",
          "subtitle": "Perhaps you would like to ask me about these companies:",
          "buttons": [],
      }];
      var otherCompaniesSubSet = otherCompanies.slice(0,3);
      otherCompaniesSubSet.forEach(function(altCompany){
          otherCompaniesElement[0].buttons.push({
              "type": "postback",
              "title": altCompany,
              // payload must be string, max 100 chars
              "payload": altCompany
          })
      })
      payloads.push(otherCompaniesElement);
  }

  if (!payloads.length) {
    var textInput = commonRequest.context.textInput;
    payloads.push([{
        "title": "Nothing found!",
        "subtitle": "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")",
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman site"
        }],
    }])
  }

  botSpecificResponse.payloads = payloads;
  return botSpecificResponse;
}

// duplicate function - live elsewhere?
function sendResponseToPlatform(payload, context) {
  if (!!context.isTest) {
    console.log("Test flag detected in payload context.");
    context.sendResponse(payload);
    return Q.when();
  }
  else if (!payload || (payload === [])) {
    console.log("No payload data detected.");
    return Q.when();
  }
  else {
    console.log("Standard data-having payload detected, sending a response");
    return sendRequestAsReply(payload, context);
  }
}

// unique function
function sendRequestAsReply(payload, context) {
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

module.exports = {
  // getResponseObj: getResponseObj,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest,
  sendErrorResponse: sendErrorResponse,
  verify: verify,
  translateRequestToCommonFormat: translateRequestToCommonFormat
  translateCommonResponseToPlatform: translateCommonResponseToPlatform
}