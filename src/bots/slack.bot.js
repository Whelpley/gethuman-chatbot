'use strict';

const utilities = require('../brain/utilities');
const config = require('../config/config');
const request = require('request');
const Q = require('q');


/**
 * Verifies that request actually coming from Slack
 * not currently in use
 *
 * @param req
 * @param res
 */
// function verify() {
//   console.log("Nothing to see here.")
// }

/**
 * Makes array of generic request objects from incoming context
 *
 * @param context
 * @return {genericRequests}
 */
function translateRequestToGenericFormats(context) {
  var text = context.userRequest.text;
  var verifyToken = config.slackVerifyToken;
  var incomingToken = context.userRequest.token;
  var genericRequests = [{
    reqType: 'user-input',
    userInput: '',
    context: context
  }];

  // checking for valid token from Slack
  if (verifyToken !== incomingToken) {
    console.log('Slack access token mismatch! Ignoring incoming request.');
    console.log('Incoming Token: ' + incomingToken);
    console.log('Verify Token: ' + verifyToken);
    return [];
  };
  console.log('Slack access token match! It\'s all good, man.');

  if (text) {
    genericRequests[0].userInput = text;
  };
  if (text.toLowerCase() === 'help') {
    console.log('Detected user input of \"help\"');
    genericRequests[0].reqType = 'help';
  };
  console.log('Slack bot has prepared this generic request: ' + JSON.stringify(genericRequests));
  return genericRequests;
}

/**
 * Takes generic response data and structures payloads for Slack sending
 *
 * @param genericResponse
 * @return {payloads}
 */
function generateResponsePayloads(genericResponse) {
  console.log("About to begin generating payloads from genericResponse.");
  // form basic payload
  var payloads = formBasicPayload(genericResponse);
  var type = genericResponse.type;

  // if a False object passed in, passes down False to next step
  if (!genericResponse) {
    return false;
  };

  // Refactor to switch statement?
  // Case: no user input
  if (type === 'no-input') {
    console.log('No user input flag detected in genericResponse.');
    payloads[0].json.text = 'Tell me the company you would like to contact.';
    return payloads;
  } else if (type === 'help') {
    // Case: Help user
    console.log('Help flag detected in genericResponse.');
    payloads[0].json.text = 'It looks like you need some help. Please tell me the name of the company you want to reach, and I will provide you with a list of the top issues for customers of this company, the company\'s contact info, and a list of other companies you may want to search for.';
    return payloads;
  } else if (type === 'nothing-found') {
    // Case: nothing returned from Companies search / junk input
    console.log('No Company Results flag detected in genericResponse.');
    payloads[0].json.text = 'I couldn\'t tell what you meant by \"' + genericResponse.userInput + '\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")';
    return payloads;
  } else if (type === 'standard') {
    // do we need the explicit type check after the first two, or just 'else'?
    // Refactor inner parts of this case to a function?
    console.log('Standard type flag detected in genericResponse.');
    var name = genericResponse.data.name || '';
    var posts = genericResponse.data.posts || [];
    var otherCompanies = genericResponse.data.otherCompanies || [];
    var topContacts = formatContacts(genericResponse.data.contactMethods);
    if (posts && posts.length) {
      payloads = loadPostsAttachments(payloads, posts, name);
      console.log('Posts info pushed into Payloads');
    };
    if (topContacts) {
      payloads = loadContactsAttachments(payloads, topContacts, name);
      console.log('Company Contact Info pushed into Payloads');
    };
    if (otherCompanies && otherCompanies.length) {
      payloads = loadOtherCompaniesAttachments(payloads, otherCompanies, name);
      console.log('Other Companies info pushed into Payloads');
    };
    if (!payloads[0].json.attachments.length) {
        payloads[0].json.text = 'I couldn\'t find anything for \"' + name + '\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")';
        console.log('No card info found for Companies, returning Nothing Found text.');
    }
    return payloads;
  }
}

/**
 * Forms base payload for Slack response
 *
 * @param genericResponse
 * @return {payloads}
 */
function formBasicPayload(genericResponse) {
  var path = config.slackAccessToken;
  var uri = 'https://hooks.slack.com/services/' + path;
  var channel = genericResponse.context.userRequest.channel_id;
  var payloads = [{
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
  return payloads;
};

/**
 * Forms payload attachment for Posts information
 *
 * @param payloads
 * @param posts
 * @param name
 * @return {payloads}
 */
function loadPostsAttachments(payloads, posts, name) {
  var colors = utilities.colors;
  payloads[0].json.text = 'Top issues for ' + name + ':';
  for (let i = 0; i < posts.length; i++) {
      let title = posts[i].title || '';
      let urlId = posts[i].urlId || '';
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
  return payloads;
};

/**
 * Forms payload attachment for Contact information
 *
 * @param payloads
 * @param topContacts
 * @param name
 * @return {payloads}
 */
function loadContactsAttachments(payloads, topContacts, name) {
  payloads[0].json.attachments.push({
      fallback: 'Contact info for ' + name,
      title: 'Best ways to contact ' + name,
      color: '#999999',
      text: topContacts,
  });
  return payloads;
}

/**
 * Forms payload attachment for Other Companies information
 *
 * @param payloads
 * @param otherCompanies
 * @param name
 * @return {payloads}
 */
function loadOtherCompaniesAttachments(payloads, otherCompanies, name) {
  var otherCompaniesList = convertArrayToBoldList(otherCompanies);
  payloads[0].json.attachments.push({
      fallback: 'Other solutions',
      title: 'Were you talking about ' + name + '?',
      color: '#BBBBBB',
      text: 'Or maybe you meant ' + otherCompaniesList + '?',
      mrkdwn_in: ["text"]
  });
  return payloads;
}

/**
 * Takes contact methods, forms a structured string of <= 3 items for display
 *
 * @param contactMethods
 * @return {topContacts}
 */
function formatContacts(contactMethods) {
  var topContacts = '';
  var counter = 1;
  for(var key in contactMethods) {
    if (contactMethods.hasOwnProperty(key) && (counter <= 3) && (contactMethods[key])) {
      switch(key) {
          case 'twitter':
              topContacts = topContacts + '<https://twitter.com/' + contactMethods[key] +'|Twitter> | ';
              break;
          case 'web':
              topContacts = topContacts + '<' + contactMethods[key] +'|Web> | ';
              break;
          case 'chat':
              topContacts = topContacts + '<' + contactMethods[key] +'|Chat> | ';
              break;
          case 'facebook':
              topContacts = topContacts + '<' + contactMethods[key] +'|Facebook> | ';
              break;
          default:
              topContacts = topContacts + contactMethods[key] + ' | ';
      }
      counter += 1;
    }
  }
  if (topContacts) {
    topContacts = topContacts.slice(0, -3);
  }
  console.log("Formatted string for Slack contact methods: " + topContacts);
  return topContacts;
};

/**
 * convert an array of strings to one string separated by commas, with each entry *bolded*
 *
 * @param arrayOfStrings
 * @return {otherCompaniesList}
 */
function convertArrayToBoldList(arrayOfStrings) {
  var otherCompaniesList = '*';
  otherCompaniesList = otherCompaniesList + arrayOfStrings.join('*, *') + "*";
  return otherCompaniesList;
}

/**
 * OAuth stuff
 *
 * @return {promise}
 */
function oauthResponse(req, res) {
  var query = req.query;
  console.log('Query captured from OAuth request: ' + JSON.stringify(query));
  var code = query.code || '';
  var clientId = config.slackClientId || '';
  var clientSecret = config.slackClientSecret || '';
  // var deferred = Q.defer();
  var uri = 'https://slack.com/api/oauth.access';
  var payload = {
    uri: uri,
    method: 'POST',
    json: {
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    }
  };
  console.log('Payload prepared for OAuth response: ' + JSON.stringify(payload));

  // You will need to exchange the code for an access token using the oauth.access method.
  request(payload, function (error, response, body) {
    if (error) {
      console.log('Ran into error while sending reply to OAuth prompt: ' + error);
    }
    else {
      console.log('Success of reply to OAuth prompt: ' + JSON.stringify(body));
      res.redirect('http://localhost:4200');
    }
  });
};


module.exports = {
  // verify: verify,
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads,
  formBasicPayload: formBasicPayload,
  loadPostsAttachments: loadPostsAttachments,
  loadContactsAttachments: loadContactsAttachments,
  loadOtherCompaniesAttachments: loadOtherCompaniesAttachments,
  formatContacts: formatContacts,
  convertArrayToBoldList: convertArrayToBoldList,
  oauthResponse: oauthResponse
};
