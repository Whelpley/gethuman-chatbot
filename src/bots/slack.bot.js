'use strict'

// Send-related Requires should get moved out
var utilities = require('../brain/utilities');
var Q = require('q');
var config = require('../config/config');
var request = require('request');

// not needed?
// will delete this if won't cause problems when missing
function verify() {
  console.log("Nothing to see here.")
}

function translateRequestToGenericFormats(context) {
  var genericRequests = [{
    reqType: 'user-input',
    userInput: '',
    context: context
  }];
  var text = context.userRequest.text;
  if (text) {
    genericRequests[0].userInput = text;
  }
  return genericRequests;
}

function generateResponsePayloads(genericResponse) {
  var payloads =  [];
  console.log("About to begin generating payloads from genericResponse.");
// Case: no user input
  if (genericResponse.type === 'no-input') {
    console.log("No user input flag detected in genericResponse.");
    payloads.push([{
        username: 'GetHuman',
        text: "Tell me the company you would like to contact.",
        icon_emoji: ':gethuman:'
    }]);
    return payloads;
  }
// Case: nothing returned from Companies search / junk input
  else if (genericResponse.type === 'nothing-found') {
    console.log("No Company Results flag detected in genericResponse.");
    payloads.push([{
        username: 'GetHuman',
        text: "I couldn't tell what you meant by \"" + genericResponse.userInput + "\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")",
        icon_emoji: ':gethuman:',
    }]);
    return payloads;
  }
  // do we need the explicit type check after the first two?
  else if (genericResponse.type === 'standard') {
    var name = genericResponse.data.name;
    var posts = genericResponse.data.posts;
    var otherCompanies = genericResponse.data.otherCompanies;
    var topContacts = utilities.formatTextField(genericResponse.data.contactMethods);
    var colors = utilities.colors;

    payloads.push([{
      // may not need to set these params - can auto-set in Slack settings
        username: 'GetHuman',
        icon_emoji: ':gethuman:',
        attachments: []
    }]);
    console.log("Basic info pushed into Payloads");

  // get payload-loaders into sub-functions for testing
    if (posts && posts.length) {
        payloads[0][0].text = "Top issues for " + name + ":";
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
                        "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve for me - $20>",
                        "short": true
                    },
                    {
                        "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|More info ...>",
                        "short": true
                    }
                ]
            };
            payloads[0][0].attachments.push(singleAttachment);
        };
      console.log("Posts info pushed into Payloads");
    }

    // attach Company contact info:
    payloads[0][0].attachments.push({
        "fallback": "Contact info for " + name,
        "title": "Best ways to contact " + name + ":",
        "color": '#999999',
        "text": topContacts,
    });
    console.log("Company Contact Info pushed into Payloads");


    // attach Other Companies info if they exist
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesList = convertArrayToBoldList(otherCompanies);
        payloads[0][0].attachments.push({
            "fallback": "Other solutions",
            "title": "Were you talking about " + name + "?",
            "color": '#BBBBBB',
            "text": "Or maybe you meant " + otherCompaniesList + "?",
            "mrkdwn_in": ["text"]
        });
        console.log("Other Companies info pushed into Payloads");
    }

    if (!payloads[0][0].attachments.length) {
        payloads[0][0].text = "I couldn't find anything for \"" + name + "\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")"
        console.log('No card info found for Companies, returning Nothing Found text.');
    }
    return payloads;
  }
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
//have to access Payload index 0 for Slack send
  var deferred = Q.defer();
  // TO-DO: access this from context
  var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;

// should this be extracted elsewhere? Any other reason to keep context this far?
  payload[0].channel = context.userRequest.channel_id;
  console.log("Payload channel: " + payload[0].channel);

  console.log("Last step before sending this payload: " + JSON.stringify(payload));
// eventually want to send this as the response to original request

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload[0])
  }, function (error, response, body) {
    if (error) {
      console.log("Ran into error while making request to send Slack payload: " + error);
      deferred.reject(error);
    }
    else {
      deferred.resolve();
    }
  });
  return deferred.promise;
}

function formatTextField(contactMethods) {
  var result = '';
  var counter = 1;
  for(var key in contactMethods) {
    if (contactMethods.hasOwnProperty(key) && (counter <= 3) && (contactMethods[key])) {
      switch(key) {
          case 'twitter':
              result = result + '<https://twitter.com/' + contactMethods[key] +'|Twitter> | ';
              break;
          case 'web':
              result = result + '<' + contactMethods[key] +'|Web> | ';
              break;
          case 'chat':
              result = result + '<' + contactMethods[key] +'|Chat> | ';
              break;
          case 'facebook':
              result = result + '<' + contactMethods[key] +'|Facebook> | ';
              break;
          default:
              result = result + contactMethods[key] + ' | ';
      }
      counter += 1;
    }
  }
  if (result) {
    result = result.slice(0,-3);
  }
  console.log("Formatted string from contact methods: " + result);
  return result;
};

// convert an array of strings to one string separated by commas, with each entry *bolded*
function convertArrayToBoldList(arrayOfStrings) {
  var result = '*';
  result = result + arrayOfStrings.join('*, *') + "*";
  return result;
}

module.exports = {
  sendResponseToPlatform: sendResponseToPlatform,
  // sendErrorResponse: sendErrorResponse,
  verify: verify,
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads
};
