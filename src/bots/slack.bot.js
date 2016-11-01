'use strict'

var utilities = require('../brain/utilities');
var config = require('../config/config');

// not needed?
// will delete this if won't cause problems when missing
// may be necessary if we want to verify that request actually coming from Slack
function verify() {
  console.log("Nothing to see here.")
}

function translateRequestToGenericFormats(context) {
  // do any other kinds of Request come from Slack?
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
s
function generateResponsePayloads(genericResponse) {
  console.log("About to begin generating payloads from genericResponse.");
  // form basic payload - separate into function?
  var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;
  var channel = genericResponse.context.userRequest.channel_id;
  var payloads =  [{
    uri: uri,
    method: 'POST',
    json: {
      channel: channel,
      username: 'GetHuman',
      icon_emoji: ':gethuman:',
      text: '',
      attachments: []
    }
  }];

// Case: no user input
  if (genericResponse.type === 'no-input') {
    console.log('No user input flag detected in genericResponse.');
    payloads[0].json.text = 'Tell me the company you would like to contact.';
    return payloads;
  }
// Case: nothing returned from Companies search / junk input
  else if (genericResponse.type === 'nothing-found') {
    console.log('No Company Results flag detected in genericResponse.');
    payloads[0].json.text = 'I couldn\'t tell what you meant by \"' + genericResponse.userInput + '\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")';
    return payloads;
  }
  // do we need the explicit type check after the first two, or just 'else'?
  else if (genericResponse.type === 'standard') {
    console.log('Standard type flag detected in genericResponse.');
    var name = genericResponse.data.name || '';
    var posts = genericResponse.data.posts || [];
    var otherCompanies = genericResponse.data.otherCompanies || [];
    var topContacts = formatTextField(genericResponse.data.contactMethods);
    var colors = utilities.colors;

  // get payload-loaders into sub-functions for testing
    if (posts && posts.length) {
        payloads[0].json.text = "Top issues for " + name + ":";
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
            payloads[0].json.attachments.push(singleAttachment);
        };
      console.log("Posts info pushed into Payloads");
    }

    // attach Company contact info:
    if (topContacts) {
      payloads[0].json.attachments.push({
          "fallback": "Contact info for " + name,
          "title": "Best ways to contact " + name + ":",
          "color": '#999999',
          "text": topContacts,
      });
      console.log("Company Contact Info pushed into Payloads");
    };

    // attach Other Companies info if they exist
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesList = convertArrayToBoldList(otherCompanies);
        payloads[0].json.attachments.push({
            "fallback": "Other solutions",
            "title": "Were you talking about " + name + "?",
            "color": '#BBBBBB',
            "text": "Or maybe you meant " + otherCompaniesList + "?",
            "mrkdwn_in": ["text"]
        });
        console.log("Other Companies info pushed into Payloads");
    }

    if (!payloads[0].json.attachments.length) {
        payloads[0].json.text = 'I couldn\'t find anything for \"' + name + '\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")'
        console.log('No card info found for Companies, returning Nothing Found text.');
    }
    return payloads;
  }
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
  console.log("Formatted string for Slack contact methods: " + result);
  return result;
};

// convert an array of strings to one string separated by commas, with each entry *bolded*
function convertArrayToBoldList(arrayOfStrings) {
  var result = '*';
  result = result + arrayOfStrings.join('*, *') + "*";
  return result;
}

module.exports = {
  // sendResponseToPlatform: sendResponseToPlatform,
  // sendErrorResponse: sendErrorResponse,
  verify: verify,
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads
};
