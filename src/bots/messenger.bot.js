'use strict'

const phoneFormatter = require('phone-formatter');

var config = require('../config/config');

/**
 * Verifies new webhook when setting up Messenger app
 *
 * @param req
 * @param res
 */
function verify(req, res) {
    console.log("Receiving webhook verification from FB.");
    var verifyToken = config.facebookVerifyToken;
    if (req.query['hub.verify_token'] === verifyToken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

/**
 * Makes array of generic request objects from incoming context
 *
 * @param context
 * @return {genericRequests}
 */
function translateRequestToGenericFormats(context) {
  var genericRequests = [];
  // iterate over messaging events - FBM uses batch processing
  var messaging_events = context.userRequest.entry[0].messaging;
  for (let i = 0; i < messaging_events.length; i++) {
    let singleGenericRequest = {
      reqType: '',
      userInput: '',
      context: context
    };
    var event = context.userRequest.entry[0].messaging[i];
    if (event.message && event.message.text) {
      console.log("Standard user input Post detected from FB");
      singleGenericRequest.userInput = event.message.text;
      singleGenericRequest.reqType = 'user-input';
      genericRequests.push(singleGenericRequest);
    }
    else if (event.postback) {
      console.log("Postback Post detected from FB");
    // Later: determine if this is triggering a new search, or displaying more Companies - right now just triggers new search
      singleGenericRequest.userInput = event.postback.payload;
      singleGenericRequest.reqType = 'postback';
      genericRequests.push(singleGenericRequest);
    }
    else {
      console.log("Non-text-input Post detected from FB");
      singleGenericRequest.reqType = 'confirmation';
      genericRequests.push(singleGenericRequest);
    }
  }
  return genericRequests;
}

/**
 * Takes generic response data and structures payloads for Messenger sending
 *
 * @param genericResponse
 * @return {payloads}
 */
function generateResponsePayloads(genericResponse) {
  console.log("About to begin generating payloads from genericResponse.");
  var payloads = [];

  // if a False object passed in (eg from a confirmation, returns blank payload)
  if (!genericResponse) {
    payloads = false;
    return payloads;
  };

  var token = config.facebookAccessToken;
  var url = 'https://graph.facebook.com/v2.6/me/messages';
  var sender = genericResponse.context.userRequest.entry[0].messaging[0].sender.id;
  var userInput = genericResponse.userInput;

  // Case: nothing returned from Companies search / junk input
  if (genericResponse.type === 'nothing-found') {
    console.log('No Company Results flag detected in genericResponse.');
    let elements = [{
        "title": "Nothing found!",
        "subtitle": 'I couldn\'t tell what you meant by \"' + userInput + '\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")',
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman"
        }],
    }];
    payloads.push(makePayload(token, url, sender, elements));
  }
  else if (genericResponse.type === 'standard') {
    console.log('Standard type flag detected in genericResponse.');

    var name = genericResponse.data.name || '';
    var posts = genericResponse.data.posts || [];
    var contactMethods = genericResponse.data.contactMethods || [];
    var otherCompanies = genericResponse.data.otherCompanies || [];

    // load Payload cards for Posts
    // export to a function
    if (posts && posts.length) {
      var postElements = loadPostElements(posts);
      // var postElements = [];
      // for (let i = 0; i < posts.length; i++) {
      //   let text = posts[i].title || '';
      //   let urlId = posts[i].urlId || ''
      //   let singleElement = {
      //       "title": "Top issues for " + name + ", #" + (i+1) + " of " + posts.length + ":",
      //       "subtitle": text,
      //       "buttons": [{
      //           "type": "web_url",
      //           "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
      //           "title": "Solve for Me - $20"
      //       },
      //       {
      //           "type": "web_url",
      //           "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
      //           "title": "More info ..."
      //       }],
      //   };
      //   postElements.push(singleElement);
      // }
      payloads.push(makePayload(token, url, sender, postElements));
    }

    // load Contact Methods card to Payload
    // export to a function?
    if (contactMethods) {
      var contactMethodsElements = [{
          "title": "Best ways to contact " + name + ":",
          'buttons': formatContactButtons(contactMethods)
      }];
      if (contactMethods.email) {
          contactMethodsElements[0].subtitle = contactMethods.email;
      };
      // only push in if at least one button exists:
      if (contactMethodsElements[0].subtitle || contactMethodsElements[0].buttons.length) {
          payloads.push(makePayload(token, url, sender, contactMethodsElements));
      };
    }

    // make Other Companies Card
    // export to a function?
    if (otherCompanies && otherCompanies.length) {
      var otherCompaniesElements = [{
          "title": "Were you trying to reach " + name + "?",
          "subtitle": "Perhaps you would like to ask me about these companies:",
          "buttons": [],
      }];
      var otherCompaniesSubSet = otherCompanies.slice(0,3);
      otherCompaniesSubSet.forEach(function(altCompany){
          otherCompaniesElements[0].buttons.push({
              "type": "postback",
              "title": altCompany,
              // payload must be string, max 100 chars
              "payload": altCompany
          })
      })
      payloads.push(makePayload(token, url, sender, otherCompaniesElements));
    }

    // if no other payload loaded up, send a Nothing-Found reponse
    if (!payloads.length) {
      let elements = [{
          "title": "Nothing found!",
          "subtitle": 'I couldn\'t tell what you meant by \"' + userInput + '\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")',
          "buttons": [{
              "type": "web_url",
              "url": "https://gethuman.com",
              "title": "Go to GetHuman"
          }],
      }];
      payloads.push(makePayload(token, url, sender, elements));
    }
  }
  console.log('Payloads prepared by Messenger bot.');
  return payloads;
}

function loadPostElements(posts, name) {
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
            "title": "Solve for Me - $20"
        },
        {
            "type": "web_url",
            "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
            "title": "More info ..."
        }],
    };
    postElements.push(singleElement);
  }
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
        if ((counter <= 3) && (contactMethods[key])) {
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
    console.log("Buttons formatted from contact methods: " + JSON.stringify(buttons));
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
  translateRequestToGenericFormats: translateRequestToGenericFormats,
  generateResponsePayloads: generateResponsePayloads,
  formatContactButtons: formatContactButtons,
  makePayload: makePayload
};