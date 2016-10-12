'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('./api/company.js'),
    postSearch = require('./api/post.js'),
    guideSearch = require('./api/guide.js'),
    preparePayload = require('./api/payloads-slack.js');

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  getErrorPayload: getErrorPayload,
  sendErrorResponse: sendErrorResponse
}

function isHandlerForRequest(platformRequestContext) {
  var responseUrl = platformRequestContext.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

// returns result of payload objects, ready to send on
function getResponsePayload(platformRequestContext) {
  // var channelId = platformRequestContext.userRequest.body.channel_id;
  var textInput = platformRequestContext.userRequest.text;
  var result = {
    raw: {},
    data: {},
    context: platformRequestContext
  }
  // will this export properly?
  if (textInput) {
    result.data =
      Q.all([
          postSearch.findByText(textInput),
          companySearch.findByText(textInput)
      ])
      .then(function (postAndCompanySearchResults) {
          var posts = postAndCompanySearchResults[0];
          var companies = postAndCompanySearchResults[1];
          if (posts && posts.length) {
              return attachCompaniesAndGuides(posts)
                .then(function (posts){
                    return preparePayload.posts(posts);
                });
          }
          else if (companies && companies.length) {
              return preparePayload.companies(companies);
          }
          else {
              return preparePayload.nothingFound();
          }
      })
    } else {
      result.data = preparePayload.inputPrompt();
    };
  result.raw = result.data;
  console.log("Payload prepared by slack handler: " + JSON.stringify(result));
  return result;
}

function sendResponseToPlatform(payload) {
  var deferred = Q.defer();
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.data.channel = payload.context.userRequest.channel_id;

  console.log("Payload about to be sent back to Slack: " + JSON.stringify(payload.data));

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

function getErrorPayload(err, platformRequestContext) {
  var result = {
    raw: {},
    data: {},
    context: platformRequestContext
  };
  result.data = preparePayload.error(err);
  result.raw = result.data;
  return result;
}

function sendErrorResponse(errorPayload) {
  console.log("Ran into an error: " + error);
  sendResponseToPlatform(errorPayload);
}

//  ---------- Helper Methods ----------------

// access Company and Guide objects matching each Question, return one mega-Posts object
//  !!!! WE DONT EVEN NEED THE GUIDES - ON THE CHOPPING BLOCK !!!!
// method could also be refactored
function attachCompaniesAndGuides(posts) {
    var companyIDs = [];
    var guideIDs = [];
    for (let i = 0; i < posts.length; i++) {
        companyIDs.push(posts[i].companyId);
        guideIDs.push(posts[i].guideId);
    };

    return Q.all([
            companySearch.findByIds(companyIDs),
            guideSearch.findByIds(guideIDs)
        ])
    .then(function (companiesAndGuides) {
        var companies = companiesAndGuides[0];
        var guides = companiesAndGuides[1];
        // refactor this
        var companyTable = {};
        var guideTable = {};
        for (let i = 0; i < companies.length; i++) {
            companyTable[companies[i]._id] = companies[i];
            guideTable[guides[i]._id] = guides[i];
        };
        for (let i = 0; i < posts.length; i++) {
            let cID = posts[i].companyId;
            posts[i].company = companyTable[cID];
            let gID = posts[i].guideId;
            posts[i].guide = guideTable[gID];
        };
        return posts;
    })
}