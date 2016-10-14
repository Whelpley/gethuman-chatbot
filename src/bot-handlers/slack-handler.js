'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('../api-gh/company.js'),
    postSearch = require('../api-gh/post.js'),
    preparePayload = require('./slack-payload.js');

// unit testable
function isHandlerForRequest(context) {
  var responseUrl = context.userRequest.response_url || '';
  return (responseUrl && responseUrl.includes('hooks.slack.com')) ? true : false;
}

function getResponsePayload(context) {
  var textInput = context.userRequest.text;

  if (!textInput) {
      var payload = {
        // raw: {},
        data:  {},
        context: context
      }
      payload.data = preparePayload.inputPrompt();
      // payload.raw = payload.data;
      return Q.when(payload);
  }
  console.log('About to search API for input: ' + textInput);
  return Q.all([
      postSearch.findByText(textInput),
      companySearch.findByText(textInput)
  ])
  .then(getPayload)
}

// check connection from previous function
// it may have
function getPayload(postAndCompanySearchResults) {
  console.log('About to load payload object from search results');
  var payload = {
    // raw: {},
    data:  {},
    context: context
  }
  var posts = postAndCompanySearchResults[0];
  var companies = postAndCompanySearchResults[1];
  if (posts && posts.length) {
    // is it a bad idea to have a nested .then?
      return queryCompaniesOfPosts(posts)
        .then(function (posts){
            payload.data = preparePayload.posts(posts);
            // payload.raw = payload.data;
            return payload;
        });
  }
  else if (companies && companies.length) {
      payload.data = preparePayload.companies(companies);
      // payload.raw = payload.data;
      return payload;
  }
  else {
      payload.data = preparePayload.nothingFound();
      // payload.raw = payload.data;
      return payload;
  }
}

// does it need to wrap up with 'res.status(200).end()' at end? Yes....
function sendResponseToPlatform(payload) {
  // shoot back an immediate Status 200 to let Slack know it's all cool
  payload.context.finishResponse();

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

// function getPayloadFromPostAndCompanySearch(postAndCompanySearchResults) {
//   var posts = postAndCompanySearchResults[0];
//   var companies = postAndCompanySearchResults[1];
//   if (posts && posts.length) {
//     // is it a bad idea to have a nested .then?
//       return queryCompaniesOfPosts(posts)
//         .then(function (posts){
//             payload.data = preparePayload.posts(posts);
//             // payload.raw = payload.data;
//             return payload;
//         });
//   }
//   else if (companies && companies.length) {
//       payload.data = preparePayload.companies(companies);
//       // payload.raw = payload.data;
//       return payload;
//   }
//   else {
//       payload.data = preparePayload.nothingFound();
//       // payload.raw = payload.data;
//       return payload;
//   }
// }

function queryCompaniesOfPosts(posts) {
    var companyIDs = [];
    for (let i = 0; i < posts.length; i++) {
        companyIDs.push(posts[i].companyId);
    };
    return Q.when(companySearch.findByIds(companyIDs))
      // .then(attachCompaniesToPosts(companies))
      .then(function (companies) {
        var companyTable = {};
        for (let i = 0; i < companies.length; i++) {
            companyTable[companies[i]._id] = companies[i];
        };
        for (let i = 0; i < posts.length; i++) {
            let cID = posts[i].companyId;
            posts[i].company = companyTable[cID];
        };
        return posts;
    })
}

// will this carry the reference to the Posts object?
// if not, how to pass in Posts?
// function attachCompaniesToPosts(companies) {
//   var companyTable = {};
//   for (let i = 0; i < companies.length; i++) {
//       companyTable[companies[i]._id] = companies[i];
//   };
//   for (let i = 0; i < posts.length; i++) {
//       let cID = posts[i].companyId;
//       posts[i].company = companyTable[cID];
//   };
//   return posts;
// }

// ------------------------------

module.exports = {
  isHandlerForRequest: isHandlerForRequest,
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  sendErrorResponse: sendErrorResponse
}
