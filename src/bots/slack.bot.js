'use strict';

const utilities = require('../brain/utilities');

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
 */
function translateRequestToGenericFormats(context) {
  let text = context.userRequest.text;
  // let verifyToken = context.config.slackVerifyToken;
  // let incomingToken = context.userRequest.token;
  let genericRequests = [{
    reqType: 'user-input',
    userInput: '',
    context: context
  }];

  // TODO: See why this does not match
  // // checking for valid token from Slack
  // // (export to function?)
  // if (verifyToken !== incomingToken) {
  //   console.log('Slack access token mismatch! Ignoring incoming request.');
  //   console.log('Incoming Token: ' + incomingToken);
  //   console.log('Verify Token: ' + verifyToken);
  //   return [];
  // }
  // console.log('Slack access token match! It\'s all good, man.');

  if (text) {
    genericRequests[0].userInput = text;
  }
  if (text.toLowerCase() === 'help') {
    console.log('Detected user input of \"help\"');
    genericRequests[0].reqType = 'help';
  }

  // console.log('Slack bot has prepared these generic requests: ' + JSON.stringify(genericRequests));
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
  let payloads = formBasicPayload(genericResponse);
  let type = genericResponse.type;

  // if a False object passed in, passes down False to next step
  if (!genericResponse) {
    return false;
  };

  // Refactor to switch statement?
  // Case: no user input
  if (type === 'no-input') {
    console.log('No user input flag detected in genericResponse.');
    payloads[0].json.text = 'What company are you having an issue with?';
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
    let name = genericResponse.data.name || '';
    let posts = genericResponse.data.posts || [];
    let otherCompanies = genericResponse.data.otherCompanies || [];
    let topContacts = formatContacts(genericResponse.data.contactMethods);
    if (posts && posts.length) {
      payloads = loadPostsAttachments(payloads, posts, name);
      console.log('Posts info pushed into Payloads');
    }
    if (topContacts) {
      payloads = loadContactsAttachments(payloads, topContacts, name);
      console.log('Company Contact Info pushed into Payloads');
    }
    if (otherCompanies && otherCompanies.length) {
      payloads = loadOtherCompaniesAttachments(payloads, otherCompanies);
      console.log('Other Companies info pushed into Payloads');
    }
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
 // **** Needs to acces specific webhook path for team that made request *****
function formBasicPayload(genericResponse) {
  var teamId = genericResponse.context.userRequest.team_id;
  var firebaseData = genericResponse.context.firebaseData;
  console.log("About to form basic payload with Firebase Data: " + JSON.stringify(firebaseData));
  // var parsedFBD = JSON.parse(firebaseData);
  // console.log("Parsed version of Firebase Data: " + parsedFBD);

  let url = firebaseData.slack.teams[teamId].incoming_webhook.url;
  let channel = firebaseData.slack.teams[teamId].channel_id;
  let payloads = [{
    uri: url,
    method: 'POST',
    json: {
      channel: channel,
      username: 'GetHuman',
      icon_emoji: ':gethuman:',
      text: '',
      attachments: []
    }
  }];
  console.log("Basic payloads formed: " + JSON.stringify(payloads));

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
  let colors = utilities.colors;
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
                  "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Fix this issue for me>",
                  "short": true
              },
              {
                  "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|More...>",
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
  let title = 'Best way to contact ' + name;
  if (topContacts.includes('|')) {
    title = 'Best ways to contact ' + name;
  };
  payloads[0].json.attachments.push({
      fallback: 'Contact info for ' + name,
      title: title,
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
function loadOtherCompaniesAttachments(payloads, otherCompanies) {
  let otherCompaniesList = otherCompanies.slice(0,3).join(', ');
  payloads[0].json.attachments.push({
      fallback: 'Other solutions',
      title: 'Or maybe you meant:',
      color: '#BBBBBB',
      text: otherCompaniesList,
      mrkdwn_in: ["text"]
  });
  return payloads;
}

/**
 * Takes contact methods, forms a structured string of <= 2 items for display
 *
 * @param contactMethods
 * @return topContacts
 */
function formatContacts(contactMethods) {
  let topContacts = '';
  let counter = 1;
  for(let key in contactMethods) {
    if (contactMethods.hasOwnProperty(key) && (counter <= 2) && (contactMethods[key])) {
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
}


module.exports = {
  // verify: verify,
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads,
  formBasicPayload: formBasicPayload,
  loadPostsAttachments: loadPostsAttachments,
  loadContactsAttachments: loadContactsAttachments,
  loadOtherCompaniesAttachments: loadOtherCompaniesAttachments,
  formatContacts: formatContacts
};
