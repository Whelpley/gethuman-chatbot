'use strict';

let firebase = require('firebase');

const utilities = require('../brain/utilities');
const config = require('../config/config');
const request = require('request');

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
  let verifyToken = config.slackVerifyToken;
  let incomingToken = context.userRequest.token;
  let genericRequests = [{
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
  }
  console.log('Slack access token match! It\'s all good, man.');

  // extract ____ from context.userRequest.token
  // draw down Firebase DB
  // extract Incoming Webhook URL matching the token in DB
  // save to Context.webHookUrl

  if (text) {
    genericRequests[0].userInput = text;
  }
  if (text.toLowerCase() === 'help') {
    console.log('Detected user input of \"help\"');
    genericRequests[0].reqType = 'help';
  }
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
      payloads = loadOtherCompaniesAttachments(payloads, otherCompanies, name);
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

  // let path = config.slackAccessPath;
  // let uri = 'https://hooks.slack.com/services/' + path;

  // How to determine if we're accessing home account, or
  // How to determine dev vs production environment?

  let uri = accessUri(genericResponse);

  let channel = genericResponse.context.userRequest.channel_id;
  let payloads = [{
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
  let otherCompaniesList = convertArrayToBoldList(otherCompanies);
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
 */
function formatContacts(contactMethods) {
  let topContacts = '';
  let counter = 1;
  for(let key in contactMethods) {
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
}

/**
 * convert an array of strings to one string separated by commas, with each entry *bolded*
 *
 * @param arrayOfStrings
 * @return {otherCompaniesList}
 */
function convertArrayToBoldList(arrayOfStrings) {
  let otherCompaniesList = '*';
  otherCompaniesList = otherCompaniesList + arrayOfStrings.join('*, *') + "*";
  return otherCompaniesList;
}

// /**
//  * OAuth stuff
//  *
//  * @return {promise}
//  */
// function oauthResponse(req, res) {
//   let query = req.query;
//   console.log('Query captured from OAuth request: ' + JSON.stringify(query));
//   let code = query.code || '';
//   let clientId = config.slackClientId || '';
//   let clientSecret = config.slackClientSecret || '';
//   // let deferred = Q.defer();
//   let uri = 'https://slack.com/api/oauth.access';
//   let payload = {
//     uri: uri,
//     method: 'POST',
//     qs: {
//       client_id: clientId,
//       client_secret: clientSecret,
//       code: code
//     }
//   };
//   console.log('Payload prepared for OAuth response: ' + JSON.stringify(payload));

//   // You will need to exchange the code for an access token using the oauth.access method.
//   request(payload, function (error, response, body) {
//     if (error) {
//       console.log('Ran into error while sending reply to OAuth prompt: ' + error);
//     } else {
//       console.log('Success of reply to OAuth prompt: ' + JSON.stringify(body));
//       res.redirect('http://localhost:4200');
//     }
//   });
// }

// calls to Firebase to retrieve incoming webhook url
function accessUri(genericResponse) {
  let uri = '';
  let teamId = genericResponse.context.userRequest.team_id;

  // Initialize Firebase
  var firebaseApiKey = config.firebaseApiKey;
  var firebaseProjectName = config.firebaseProjectName;
  var firebaseSenderId = config.firebaseSenderId;
  var firebaseConfig = {
    apiKey: firebaseApiKey,
    authDomain:  firebaseProjectName + '.firebaseapp.com',
    databaseURL: 'https://' + firebaseProjectName + '.firebaseio.com',
    storageBucket: firebaseProjectName + '.appspot.com',
    messagingSenderId: firebaseSenderId
  };
  firebase.initializeApp(firebaseConfig);


  // read Firebase data
  // do we need to Promise this?
  // firebase.database().ref('teams/' + teamId).once('value').then(function(snapshot) {
  //   uri = snapshot.val().incoming_webhook.url;
  // });


  var state = {};

  firebase.database().ref('gh').on('value', function(snapshot) {
    Object.assign(state, snapshot);
  });

  // state.slack.teams[teamIdHere]




  console.log('Uri extracted from Firebase DB: ' + uri);
  return uri;
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
  // oauthResponse: oauthResponse
};
