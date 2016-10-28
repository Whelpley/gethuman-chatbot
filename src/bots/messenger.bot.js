'use strict'

const config = require('../config/config');
const token = config.facebookAccessToken;

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

// no working just yet - needs to account for different structure of verification request
function verify(req, res) {
    console.log("Receiving webhook verification from FB.");
    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

function translateRequestToGenericFormat(context) {
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

function translateGenericResponseToPlatform(commonResponse) {
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
      // this function should live in this file instead of utilities
      'buttons': formatContactButtonsMessenger(contactInfo)
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

// duplicated in Slack/etc? export to module!
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


//  should exist in Messenger Handler
function formatContactButtonsMessenger(contactInfo) {
    var buttons = [];
    var counter = 1;
    for(var key in contactInfo) {
        if ((counter <= 3) && (contactInfo[key])) {
            var button = {};
            switch(key) {
                case 'twitter':
                    button = {
                        "type": "web_url",
                        "url": 'https://twitter.com/' + contactInfo[key],
                        "title": "Twitter"
                    };
                    break;
                case 'web':
                    button = {
                        "type": "web_url",
                        "url": contactInfo[key],
                        "title": "Web"
                    };
                    break;
                case 'chat':
                    button = {
                        "type": "web_url",
                        "url": contactInfo[key],
                        "title": "Chat"
                    };
                    break;
                case 'facebook':
                    button = {
                        "type": "web_url",
                        "url": contactInfo[key],
                        "title": "Facebook"
                    };
                    break;
                case 'phone':
                    button = {
                        "type": "phone_number",
                        "payload": phoneFormatter.format(contactInfo[key], "+1NNNNNNNNNN"),
                        "title": contactInfo[key]
                    }
                    break;
                case 'email':
                    console.log("Email detected, not creating button for it because Messenger won't let us.");
                    break;
                default:
                    console.log("Something went wrong in Facebook contact button formatting");
            }
            if (button.type) {
                buttons.push(button);
                counter += 1;
            }
        }
    }
    console.log("Buttons formatted from contact info: " + JSON.stringify(buttons));
    return buttons;
}

module.exports = {
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest,
  sendErrorResponse: sendErrorResponse,
  verify: verify,
  translateRequestToGenericFormat: translateRequestToGenericFormat,
  translateGenericResponseToPlatform: translateGenericResponseToPlatform,
  formatContactButtonsMessenger: formatContactButtonsMessenger
};