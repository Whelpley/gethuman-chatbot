'use strict'

const token = process.env.FB_PAGE_ACCESS_TOKEN

function isHandlerForRequest(context) {
  var object = context.userRequest.object || '';
  return (object === 'page') ? true : false;
}

function getResponsePayload(context) {
  var messaging_events = context.userRequest.entry[0].messaging;

  for (let i = 0; i < messaging_events.length; i++) {
    let event = context.userRequest.entry[0].messaging[i]
    let sender = event.sender.id

    // handling text input
    if (event.message && event.message.text) {
        let textInput = event.message.text;
        console.log("Text input from user: " + textInput);
    }
  }

  context.finishResponse;
}


  // var payload = {
  //   raw: {},
  //   data:  {},
  //   context: context
  // }
  // if (!textInput) {
  //     return Q.when(preparePayload.inputPrompt(payload));
  // }
  // console.log('About to search API for input: ' + textInput);
  // return Q.all([
  //     postSearch.findByText(textInput),
  //     companySearch.findByText(textInput)
  // ])
  // .then(function (postAndCompanySearchResults) {
  //   console.log('About to load payload object from search results');
  //   var posts = postAndCompanySearchResults[0];
  //   var companies = postAndCompanySearchResults[1];

  //   if (posts && posts.length) {
  //     return preparePayload.addPostsToPayload(payload, posts);
  //   }
  //   else if (companies && companies.length) {
  //     return preparePayload.addCompaniesToPayload(payload, companies);
  //   }
  //   else {
  //     return preparePayload.nothingFound(payload);
  //   }
  // });


function sendResponseToPlatform() {
  console.log('Hit the sendResponseToPlatform Function');
}


module.exports = {
  getResponsePayload: getResponsePayload,
  sendResponseToPlatform: sendResponseToPlatform,
  isHandlerForRequest: isHandlerForRequest
}