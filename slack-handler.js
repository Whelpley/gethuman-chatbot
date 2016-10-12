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
    data:  {},
    context: platformRequestContext
  }
  if (textInput) {
      Q.all([
          postSearch.findByText(textInput),
          companySearch.findByText(textInput)
      ])
      .then(function (postAndCompanySearchResults) {
          var posts = postAndCompanySearchResults[0];
          console.log("Posts returned by first query: " + JSON.stringify(posts).substring(0,200));
          var companies = postAndCompanySearchResults[1];
          console.log("Companies returned by first query:: " + JSON.stringify(companies).substring(0,200));
          if (posts && posts.length) {
            // is it a bad idea to have a nested .then?
              // return attachCompaniesAndGuides(posts)
              attachCompaniesAndGuides(posts)
                .then(function (posts){
                    console.log("About to prepare payload from Posts object: " + JSON.stringify(posts).substring(0,200));
                    // works until step above???
                    result.data = preparePayload.posts(posts);
                    result.raw = result.data;
                    // does not go to here
                    console.log("Payload prepared by slack handler for POSTS: " + JSON.stringify(result));
                    return result;
                });
          }
          else if (companies && companies.length) {
              result.data = preparePayload.companies(companies);
              result.raw = result.data;
              console.log("Payload prepared by slack handler for COMPANIES: " + JSON.stringify(result));
              // goes to here fine!
              return result;
          }
          else {
              result.data = preparePayload.nothingFound();
              result.raw = result.data;
              console.log("Payload prepared by slack handler for NOTHING FOUND: " + JSON.stringify(result));
              // goes to here fine!
              return result;
          }
      })
    } else {
      result.data = preparePayload.inputPrompt();
      result.raw = result.data;
      console.log("Payload prepared by slack handler for NO TEXT INPUT: " + JSON.stringify(result));
      return result;
    };
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
    // data: {},
    context: platformRequestContext
  };
  result.raw = preparePayload.error(err);
  // result.raw = result.data;
  return Q.when(result);
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
    console.log("About to attach C and G to Posts.");
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
        // do I need to translate these to map/forEach operations for async?
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
        console.log("About to return Posts after attaching C and G: " + JSON.stringify(posts).substring(0,200));
        return posts;
    })
}