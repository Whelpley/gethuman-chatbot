'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('./api/company.js'),
    postSearch = require('./api/post.js'),
    preparePayload = require('./api/payloads-slack.js');

function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

function getResponsePayload(context) {
  var textInput = context.userRequest.text;
  var payload = {
    // raw: {},
    data:  {},
    context: context
  }

  if (!textInput) {
      payload.data = preparePayload.inputPrompt();
      // payload.raw = payload.data;
      console.log("Payload prepared by slack handler for NO TEXT INPUT: " + JSON.stringify(payload));
      return Q.when(payload);
  }

  return Q.all([
      postSearch.findByText(textInput),
      companySearch.findByText(textInput)
  ])
  .then(function (postAndCompanySearchResults) {
      var posts = postAndCompanySearchResults[0];
      // console.log("Posts returned by first query: " + JSON.stringify(posts).substring(0,200));
      var companies = postAndCompanySearchResults[1];
      // console.log("Companies returned by first query:: " + JSON.stringify(companies).substring(0,200));
      if (posts && posts.length) {
        // is it a bad idea to have a nested .then?
          return attachCompaniesToPosts(posts)
            .then(function (posts){
                // console.log("About to prepare payload from Posts object: " + JSON.stringify(posts).substring(0,200));
                payload.data = preparePayload.posts(posts);
                // payload.raw = payload.data;
                // console.log("Payload prepared by slack handler for POSTS: " + JSON.stringify(payload));
                return payload;
            });
      }
      else if (companies && companies.length) {
          payload.data = preparePayload.companies(companies);
          // payload.raw = payload.data;
          console.log("Payload prepared by slack handler for COMPANIES: " + JSON.stringify(payload));
          return payload;
      }
      else {
          payload.data = preparePayload.nothingFound();
          // payload.raw = payload.data;
          console.log("Payload prepared by slack handler for NOTHING FOUND: " + JSON.stringify(payload));
          return payload;
      }
  })
}

// for other bots, this will just call context.sendResponse(payload) under the hood
// does it need to wrap up with 'res.status(200).end()' at end?
function sendResponseToPlatform(payload) {
  var deferred = Q.defer();
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.data.channel = payload.context.userRequest.channel_id;
  // console.log("Payload about to be sent back to Slack: " + JSON.stringify(payload.data));
  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload.data)
  }, function (error, response, body) {
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
    // raw: {},
    data: {},
    context: context
  };
  payload.data = preparePayload.error(err);
  sendResponseToPlatform(errorPayload);
}

//  ---------- Helper Methods ----------------

function attachCompaniesToPosts(posts) {
    // console.log("About to attach Companies to Posts.");
    var companyIDs = [];
    for (let i = 0; i < posts.length; i++) {
        companyIDs.push(posts[i].companyId);
    };
    return Q.when(companySearch.findByIds(companyIDs))
      .then(function (companies) {
        // refactor this
        var companyTable = {};
        // do I need to translate these to map/forEach operations for async?
        for (let i = 0; i < companies.length; i++) {
            companyTable[companies[i]._id] = companies[i];
        };
        for (let i = 0; i < posts.length; i++) {
            let cID = posts[i].companyId;
            posts[i].company = companyTable[cID];
        };
        console.log("About to return Posts after attaching Companies: " + JSON.stringify(posts).substring(0,400));
        return posts;
    })
}

// ------------------------------

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse
}
