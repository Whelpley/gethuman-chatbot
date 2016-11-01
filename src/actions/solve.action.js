'use strict'

// var request = require('request');
var Q = require('q');
var companySearch = require('../services/company-api-gh');
var postSearch = require('../services/post-api-gh');
var utilities = require('../brain/utilities');

/**
 * Processes generic request into Company object, with attached data
 *
 * @param genericRequest
 * @return {genericResponse} Promise
 */
function processRequest(genericRequest) {
  // send back a 200 response immediately
  utilities.preResponse(genericRequest.context);
  // get data from Gethuman, then process into generic response
  return Q.when(queryCompany(genericRequest))
    .then((queryResult) => {
      return structureGenericResponse(queryResult)
    });
}

/**
 * Processes generic request into Company object, with attached data
 *
 * @param genericRequest
 * @return {queryResult} Promise
 */
function queryCompany(genericRequest) {
  var queryResult = {
    userInput: genericRequest.userInput,
    // Company object, with Posts and Other Companies attached
    data: {},
    // types: 'standard', 'no-input', 'not-found'
    type: '',
    context: genericRequest.context
  };
  var userInput = genericRequest.userInput;
  var company = {};

  if (!userInput) {
    queryResult.type = 'no-input';
    return Q.when(queryResult);
  }

  return Q.when(companySearch.findByText(userInput))
  .then(function(companySearchResults) {
    // ----------------
    // Pick out Company of interest from search results
    // ( can we separate out this as function?)
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === userInput.toLowerCase();
    });

    if (!companySearchResults.length) {
      console.log('Nothing found in initial Company search');
      queryResult.type = 'nothing-found';
      // returning an empty object as Posts for the next step in chain
      return Q.when({});
    }
    else if (exactMatch && exactMatch.length) {
      company = exactMatch[0];
      console.log('Found an exact match from Companies search');
    }
    else {
      company = companySearchResults[0];
      console.log("Going with first result from Companies search");
    };
    // ----------------

    // If here, there is at least one Company result, which qualifies it for Standard type
    queryResult.type = 'standard';

    console.log('About to attach other companies list');
    company = attachOtherCompanies(company, companySearchResults, userInput);

    console.log('Other companies attached, about to query Posts of Company');
    return postSearch.findByCompany(company)
  })
  .then(function(posts) {
    console.log('Posts of Company returned in action handler');
    company.posts = posts;
    queryResult.data = company;
    // console.log('Result of API queries: ' + JSON.stringify(queryResult));
    return queryResult;
  });
}

function structureGenericResponse(queryResult) {
  var genericResponse = {
    userInput: queryResult.userInput,
    data: {
      name: queryResult.data.name || '' ,
      contactMethods: {
        phone: '',
        email: '',
        twitter: '',
        web: '',
        chat: '',
        facebook: ''
      },
      posts: [],
      otherCompanies: queryResult.data.otherCompanies || []
    },
    type: queryResult.type || '',
    context: queryResult.context || ''
  }
  // return early if no data or no input
  if ((queryResult.type === 'no-input') || (queryResult.type === 'nothing-found')) {
    return genericResponse;
  };
// Extract contact methods:
  genericResponse.data.contactMethods = extractContactMethods(queryResult.data);
// Extract Posts info
  var posts = queryResult.data.posts;
  if (posts && posts.length) {
    genericResponse.data.posts = posts.map((post) => {
      return {
        title: post.title || '',
        urlId: post.urlId || '',
      };
    })
  };
  return genericResponse;
}

// Should this exist in another module?
function attachOtherCompanies(company, companySearchResults, userInput) {
    var companyNames = companySearchResults.map((eachCompany) => {
      return eachCompany.name;
    });
    console.log("List of company names: " + JSON.stringify(companyNames));
    company.otherCompanies = companyNames.filter((name) => {
      return name.toLowerCase() !== userInput.toLowerCase();
    });
    return company;
};

// takes Company object, puts associated info into an result object
// should this exist in another module?
function extractContactMethods(queryResultData) {
  var contactMethods = {
    phone: '',
    email: '',
    twitter: '',
    web: '',
    chat: '',
    facebook: ''
  };
  var company = queryResultData;
  contactMethods.phone = company.callback.phone || '';
// can this be refactored into a Map function?
  let emailContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "email";
    });
  contactMethods.email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';

  let twitterContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "twitter";
    });
  contactMethods.twitter = (twitterContactMethods && twitterContactMethods.length) ? twitterContactMethods[0].target : '';

  let webContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "web";
    });
  contactMethods.web = (webContactMethods && webContactMethods.length) ? webContactMethods[0].target : '';

  let chatContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "chat";
    });
  contactMethods.chat = (chatContactMethods && chatContactMethods.length) ? chatContactMethods[0].target : '';

  let facebookContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "facebook";
    });
  contactMethods.facebook = (facebookContactMethods && facebookContactMethods.length) ? facebookContactMethods[0].target : '';

  console.log("Extracted contact info from company: " + JSON.stringify(contactMethods));
  return contactMethods;
}

module.exports = {
  processRequest: processRequest
};
