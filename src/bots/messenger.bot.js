const phoneFormatter = require('phone-formatter');
const config = require('../config/config');

/**
 * Verifies new webhook when setting up Messenger app
 *
 * @param req
 * @param res
 */
function verify(req, res) {
    var verifyToken = config.facebookVerifyToken;

    if (req.query['hub.verify_token'] === verifyToken) {
        res.send(req.query['hub.challenge']);
    } else {
      res.send('Error, wrong token');
    };
}

/**
 * Makes array of normalized request objects from incoming context
 *
 * @param context
 * @return {genericRequests}
 */
function normalizeRequests(context) {
  var normalizedRequests = [];

  // The actual events are buried in the incoming request object (via context)
  var messaging_events = context.userRequest.entry[0].messaging;

  // Need to iterate over messaging events - Messenger sends bursts of messages as single objects
  for (let i = 0; i < messaging_events.length; i++) {
    let singleNormalizedRequest = {
      reqType: 'ignore',
      userInput: '',
      context: context
    };
    let event = context.userRequest.entry[0].messaging[i];

    if (event.message && event.message.text) {
      var userInput = event.message.text;

      singleNormalizedRequest.userInput = userInput;

      if ((userInput === 'help') || (userInput === 'bot help')) {
        singleNormalizedRequest.reqType = 'help';
      }

      if ((userInput === 'hi') || (userInput === 'hello')) {
        singleNormalizedRequest.reqType = 'greeting';
      }

      // when user inputs a string starting with 'bot'
      if (userInput.slice(0, 4) === 'bot ') {
        singleNormalizedRequest.userInput = userInput.slice(4);
        singleNormalizedRequest.reqType = 'user-input';
      }
    }

    // A postback event will trigger a new search based on its payload
    if (event.postback) {
      singleNormalizedRequest.userInput = event.postback.payload;
      singleNormalizedRequest.reqType = 'postback';
    }

    normalizedRequests.push(singleNormalizedRequest);
  }
  return normalizedRequests;
}

/**
 * Takes generic response data and structures payloads to send to Messenger
 *
 * @param genericResponse
 * @return payloads
 */
function generateResponsePayloads(genericResponse) {

  // an Ignore action with call this function with no parameters
  if (!genericResponse) {
    return false;
  };

  var payloads = [];
  var token = config.facebookAccessToken;
  var url = config.facebookSendUrl;
  var type = genericResponse.type;

  /** Explanation for deep targeting:
  *     Need to dig into the incoming User Request object
  *     to find the ID of the Sender to receive the response we are constructing
  */
  var sender = genericResponse.context.userRequest.entry[0].messaging[0].sender.id;

  if (type === 'nothing-found') {
    let elements = loadNothingFoundElements();
    payloads.push(makePayload(token, url, sender, elements));
  }

  if (type === 'help') {
    let elements = loadHelpElements();
    payloads.push(makePayload(token, url, sender, elements));
  }

  if (type === 'greeting') {
    let elements = loadGreetingElements();
    payloads.push(makePayload(token, url, sender, elements));
  }

  if (type === 'standard') {
    var name = genericResponse.data.name || '';
    var posts = genericResponse.data.posts || [];
    var contactMethods = genericResponse.data.contactMethods || [];
    var otherCompanies = genericResponse.data.otherCompanies || [];
    var elements = [];

    if (posts && posts.length) {
      var postElements = loadPostElements(posts, name);
      elements = elements.concat(postElements);
    }

    if (contactMethods) {
      var contactMethodsElements = loadContactMethodsElements(contactMethods, name);
      // only push in if at least one button exists:
      if (contactMethodsElements[0].subtitle || contactMethodsElements[0].buttons.length) {
          elements = elements.concat(contactMethodsElements);
      };
    }

    if (otherCompanies && otherCompanies.length) {
      var otherCompaniesElements = loadOtherCompaniesElements(otherCompanies, name);
      elements = elements.concat(otherCompaniesElements);
    }

    // if no other payload loaded up, send a Nothing-Found reponse
    if (!elements.length) {
      let nothingFoundElements = loadNothingFoundElements();
      elements = elements.concat(nothingFoundElements);
    }

    payloads.push(makePayload(token, url, sender, elements));
  }

  return payloads;
}

/**
 * Loads response elements for Case: nothing found
 *
 * @param userInput
 * @return {elements}
 */
function loadNothingFoundElements() {
  return [{
      "title": "I didn\’t understand.",
      "subtitle": 'Please start by telling me the company name. (ex: \'bot verizon\')',
      "buttons": [{
          "type": "web_url",
          "url": "https://gethuman.com",
          "title": "Go to GetHuman"
      }],
  }];
}

/**
 * Loads response elements for Case: Help input
 *
 * @return {elements}
 */
function loadHelpElements() {
  return [{
      "title": "It sounds like you need help.",
      "subtitle": 'Start by saying \'bot\', followed by the company name. (ex: \'bot verizon\')',
      "buttons": [{
          "type": "web_url",
          "url": "https://gethuman.com",
          "title": "Go to GetHuman"
      }],
  }];
}

/**
 * Loads response elements for Case: Help input
 *
 * @return {elements}
 */
function loadGreetingElements() {
  return [{
      "title": 'Hello!',
      "subtitle": 'One of our representatives will be with you shortly.',
      "buttons": [{
          "type": 'web_url',
          "url": 'https://gethuman.com',
          "title": 'Go to GetHuman'
      }]
  },
  {
      "title": 'Want to talk to our bot?',
      "subtitle": 'Start with \'bot\', followed by the company name. (ex: \'bot verizon\')',
      "buttons": [{
          "type": 'web_url',
          "url": 'https://gethuman.com',
          "title": 'Go to GetHuman'
      }]
  }];
}

/**
 * Loads response elements for Posts cards
 *
 * @param posts
 * @param name
 * @return {postElements}
 */
function loadPostElements(posts, name) {
  var postElements = [];
  for (let i = 0; i < posts.length; i++) {
    let title = posts[i].title || '';
    let urlId = posts[i].urlId || '';
    let ghProblemsUrl = config.ghProblemsUrl;
    let ghAnswersUrl = config.ghAnswersUrl;

    let singleElement = {
        "title": title,
        "subtitle": '#' + (i+1) + ' most common ' + name + ' issue',
        "buttons": [{
            "type": "web_url",
            "url": ghProblemsUrl + encodeURIComponent(name),
            "title": "Fix this issue for me"
        },
        {
            "type": "web_url",
            "url": ghAnswersUrl + encodeURIComponent(urlId),
            "title": "More info ..."
        }],
    };
    postElements.push(singleElement);
  }
  return postElements;
};

/**
 * Loads response elements for Contact Methods cards
 *
 * @param contactMethods
 * @param name
 * @return {contactMethodsElements}
 */
function loadContactMethodsElements(contactMethods, name) {
  var contactMethodsElements = [{
      title: 'Best ways to contact ' + name + ':',
      buttons: formatContactButtons(contactMethods)
  }];
  if (contactMethods.email) {
      contactMethodsElements[0].subtitle = contactMethods.email;
  };
  return contactMethodsElements;
};

/**
 * Loads response elements for Other Companies cards
 *
 * @param otherCompanies
 * @param name
 * @return {otherCompaniesElements}
 */
function loadOtherCompaniesElements(otherCompanies, name) {
  var otherCompaniesElements = [{
      "title": "Were you trying to reach " + name + "?",
      "subtitle": "Perhaps you would like to ask me about this company:",
      "buttons": []
  }];
  var altCompany = otherCompanies[0];
  otherCompaniesElements[0].buttons.push({
      "type": "postback",
      "title": altCompany,
      "payload": altCompany
  });
  otherCompaniesElements[0].buttons.push({
      "type": "web_url",
      "url": "https://gethuman.com/",
      "title": "Something else"
  });
  return otherCompaniesElements;
};

/**
 * Takes contact methods, formats associated buttons for Messenger card
 *
 * @param contactMethods
 * @return {buttons}
 */
function formatContactButtons(contactMethods) {
    var buttons = [];
    var counter = 1;
    for(var key in contactMethods) {
        if ((counter <= 2) && (contactMethods[key])) {
            var button = {};
            switch(key) {
                case 'twitter':
                    button = {
                        "type": "web_url",
                        "url": 'https://twitter.com/' + contactMethods[key],
                        "title": "Twitter"
                    };
                    break;
                case 'web':
                    button = {
                        "type": "web_url",
                        "url": contactMethods[key],
                        "title": "Web"
                    };
                    break;
                case 'chat':
                    button = {
                        "type": "web_url",
                        "url": contactMethods[key],
                        "title": "Chat"
                    };
                    break;
                case 'facebook':
                    button = {
                        "type": "web_url",
                        "url": contactMethods[key],
                        "title": "Facebook"
                    };
                    break;
                case 'phone':
                    button = {
                        "type": "phone_number",
                        "payload": phoneFormatter.format(contactMethods[key], "+1NNNNNNNNNN"),
                        "title": contactMethods[key]
                    };
                    break;
                case 'email':
                    // Not creating button for email link because Messenger won't let us ;(
                    break;
                default:
                    // It should never go here
            }

            if (button.type) {
                buttons.push(button);
                counter += 1;
            }
        }
    }

    return buttons;
}

/**
 * Forms payload for sending to Messenger
 *
 * @param token
 * @param url
 * @param sender
 * @param elements
 * @return {payload}
 */
function makePayload(token, url, sender, elements) {
  return {
    url: url,
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
  };
};

module.exports = {
  verify: verify,
  normalizeRequests: normalizeRequests,
  generateResponsePayloads: generateResponsePayloads,
  loadOtherCompaniesElements: loadOtherCompaniesElements,
  loadContactMethodsElements: loadContactMethodsElements,
  loadPostElements: loadPostElements,
  loadNothingFoundElements: loadNothingFoundElements,
  formatContactButtons: formatContactButtons,
  makePayload: makePayload
};