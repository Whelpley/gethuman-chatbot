'use strict'

const token = process.env.FB_PAGE_ACCESS_TOKEN
const request = require('request');
const Q = require('q');
const companySearch = require('../api-gh/company.js');
const postSearch = require('../api-gh/post.js');
const preparePayload = require('./messenger-payload.js');

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

function getResponsePayload(context) {
  var messaging_events = context.userRequest.entry[0].messaging;
  console.log("All messaging events: " + JSON.stringify(messaging_events));

  for (let i = 0; i < messaging_events.length; i++) {
    let event = context.userRequest.entry[0].messaging[i]
    console.log("Event detected: " + JSON.stringify(event));
    let sender = event.sender.id

    if (event.message && event.message.text) {
      let textInput = event.message.text;
      console.log("Text input received from user: " + textInput);
      var payload = {
        raw: {},
        data:  {},
        context: context
      };
      return Q.all([
          postSearch.findByText(textInput),
          companySearch.findByText(textInput)
      ])
      .then(function (postAndCompanySearchResults) {
        console.log('Initial Post and Company searches complete, about to load payload object from search results');
        var posts = postAndCompanySearchResults[0];
        var companies = postAndCompanySearchResults[1];
        if (posts && posts.length) {
          console.log("It's going to be a Posts message return");
          return preparePayload.addPostsToPayload(payload, posts);
        }
        else if (companies && companies.length) {
          console.log("It's going to be a Companies message return");
          return preparePayload.addCompaniesToPayload(payload, companies);
        }
        else {
          console.log("It's going to be a Nothing Found message return");
          return preparePayload.nothingFound(payload);
        }
      });
    }
  }
}

function preResponse(context) {
  // shoot back an immediate Status 200 to let messenger know it's all cool

  if (!context.isTest) {
    context.finishResponse();
  }
}

function sendResponseToPlatform(payload) {
  if (payload.context.isTest) {
    payload.context.sendResponse(payload);
    return Q.when();
  }
  else {
    return sendResponseWithNewRequest(payload);
  }
}

function sendResponseWithNewRequest(payload) {
// console.log('Hitting the sendResponseToPlatform function with this payload: ' + JSON.stringify(payload).substring(0,400));
  var deferred = Q.defer();
  var elements = payload.data;
  var sender = payload.context.userRequest.entry[0].messaging[0].sender.id;
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
                        "elements": elements
                    }
                }
            },
        }
    }, function(error, response, body) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve();
      }
    });

  return deferred.promise;
}

function sendErrorResponse(err, context) {
  console.log("Ran into an error: " + err);
  var payload = {
    raw: preparePayload.error(err),
    data: {},
    context: context
  };
  payload.data = payload.raw;
  sendResponseToPlatform(payload)
}

function verify(req, res) {
    console.log("Receiving webhook verification from FB.")

    if (req.query['hub.verify_token'] === 'cmon_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
}

module.exports = {
  preResponse: preResponse,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest,
  sendErrorResponse: sendErrorResponse.
  verify: verify
}