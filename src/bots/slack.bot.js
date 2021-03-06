const config = require('../config/config');

const colors = [
    '#6E9E43',
    '#7BAB50',
    '#88B85D',
    '#94C469',
    '#A1D176',
    '#AEDE83',
    '#BBEB90',
    '#C8F89D',
    '#D4FFA9',
    '#E1FFB6',
    '#EEFFC3'
];

/**
 * Makes array of generic request objects from incoming context
 *
 * @param context
 */
function normalizeRequests(context) {
  let text = context.userRequest.text;

  let normalizedRequests = [{
    reqType: 'user-input',
    userInput: '',
    context: context
  }];

  /** Verify that incoming message is coming from Slack
  */
  // let verifyToken = context.config.slackVerifyToken;
  // let incomingToken = context.userRequest.token;
  //
  // if (verifyToken !== incomingToken) {
  //   console.log('Slack access token mismatch! Ignoring incoming request.');
  //   console.log('Incoming Token: ' + incomingToken);
  //   console.log('Verify Token: ' + verifyToken);
  //   return [];
  // }
  // console.log('Slack access token match! Request will be processed.');

  if (text) {
    normalizedRequests[0].userInput = text;
  }
  if (text.toLowerCase() === 'help') {
    normalizedRequests[0].reqType = 'help';
  }

  return normalizedRequests;
}

/**
 * Takes generic response data and structures payloads for Slack sending
 *
 * @param genericResponse
 * @return {payloads}
 */
function generateResponsePayloads(genericResponse) {
  let payloads = formBasicPayload(genericResponse);
  let type = genericResponse.type;

  if (!genericResponse) {
    return false;
  };

  if (type === 'no-input') {
    payloads[0].json.text = 'What company are you having an issue with?';
    return payloads;
  }

  if (type === 'help') {
    payloads[0].json.text = 'It looks like you need some help. Please tell me the name of the company you want to reach, and I will provide you with a list of the top issues for customers of this company, the company\'s contact info, and a list of other companies you may want to search for.';
    return payloads;
  }

  if (type === 'nothing-found') {
    console.log('No Company Results flag detected in genericResponse.');
    payloads[0].json.text = 'I couldn\'t tell what you meant by \"' + genericResponse.userInput + '\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")';
    return payloads;
  }

  if (type === 'standard') {
    let name = genericResponse.data.name || '';
    let posts = genericResponse.data.posts || [];
    let otherCompanies = genericResponse.data.otherCompanies || [];
    let topContacts = formatContacts(genericResponse.data.contactMethods);

    if (posts && posts.length) {
      payloads = loadPostsAttachments(payloads, posts, name);
    }

    if (topContacts) {
      payloads = loadContactsAttachments(payloads, topContacts, name);
    }

    if (otherCompanies && otherCompanies.length) {
      payloads = loadOtherCompaniesAttachments(payloads, otherCompanies);
    }

    if (!payloads[0].json.attachments.length) {
        payloads[0].json.text = 'I couldn\'t find anything for \"' + name + '\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")';
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
  var teamId = genericResponse.context.userRequest.team_id;
  var state = genericResponse.context.state;

  let url = state.slack.teams[teamId].incoming_webhook.url;
  let channel = state.slack.teams[teamId].channel_id;
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
  payloads[0].json.text = 'Top issues for ' + name + ':';
  for (let i = 0; i < posts.length; i++) {
      let title = posts[i].title || '';
      let urlId = posts[i].urlId || '';
      let color = colors[i];
      let ghProblemsUrl = config.ghProblemsUrl;
      let ghAnswersUrl = config.ghAnswersUrl;

      let singleAttachment = {
          "fallback": "Issue for " + name,
          "title": title,
          "color": color,
          "fields": [
              {
                  "value": "<" + ghProblemsUrl + encodeURIComponent(name) + "|Fix this issue for me>",
                  "short": true
              },
              {
                  "value": "<" + ghAnswersUrl + encodeURIComponent(urlId) + "|More...>",
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
  let otherCompaniesList = otherCompanies.slice(0, 3).join(', ');
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
  return topContacts;
}


module.exports = {
  normalizeRequests: normalizeRequests,
  generateResponsePayloads: generateResponsePayloads,
  formBasicPayload: formBasicPayload,
  loadPostsAttachments: loadPostsAttachments,
  loadContactsAttachments: loadContactsAttachments,
  loadOtherCompaniesAttachments: loadOtherCompaniesAttachments,
  formatContacts: formatContacts
};
