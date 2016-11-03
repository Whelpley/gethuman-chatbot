'use strict'

var utilities = require('../brain/utilities');
var config = require('../config/config');

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
  // checking for valid token from Slack
  // Is this where this belongs?
  var accessToken = config.slackAccessToken;
  // unhappy path test
  var incomingToken = 'totally fake';
  // // happy path test
  // var incomingToken = context.userRequest.token;
  if (accessToken !== incomingToken) {
    console.log('Slack access token mismatch! Ignoring incoming request.')
    return [];
  };
  console.log('Slack access token match! It\'s all good, man.');


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

/**
 * Takes generic response data and structures payloads for Slack sending
 *
 * @param genericResponse
 * @return {payloads}
 */
function generateResponsePayloads(genericResponse) {
  console.log("About to begin generating payloads from genericResponse.");
  // if a False object passed in, passes down False to next step
  if (!genericResponse) {
    return false;
  };
  // form basic payload
  var payloads = formBasicPayload(genericResponse);
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
        payloads[0].json.text = 'I couldn\'t find anything for \"' + name + '\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")'
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
    topContacts = topContacts.slice(0,-3);
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

module.exports = {
  // verify: verify,
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads,
  formBasicPayload: formBasicPayload,
  loadPostsAttachments: loadPostsAttachments,
  loadContactsAttachments: loadContactsAttachments,
  loadOtherCompaniesAttachments: loadOtherCompaniesAttachments,
  formatContacts: formatContacts,
  convertArrayToBoldList: convertArrayToBoldList
};
