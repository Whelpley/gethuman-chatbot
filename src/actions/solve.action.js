'use strict'

var request = require('request');
var Q = require('q');
var companySearch = require('../services/company-api-gh');
var postSearch = require('../services/post-api-gh');
var utilities = require('../brain/utilities');

/**
 * Processes generic request
 *
 * @param genericRequest
 * @returns {genericResponse}
 */
function processRequest(genericRequest) {
  var genericResponse = {
    context: genericRequest.context
  };
  var userInput = genericRequest.userInput;
  var company = {noresults: true};

  // todo: do pre-response here
  utilities.preResponse(genericRequest.context);

  if (!userInput) {
    return Q.when(genericResponse);
  }

// this is where things get hairy ...

  return Q.when(companySearch.findByText(userInput))
  .then(function (companySearchResults) {

    // ----------------
    // Pick out Company of interest from search results
    // (separate out this as function for testing - MAYBE?)
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === userInput.toLowerCase();
    });

    if (!companySearchResults.length) {
      console.log("Nothing found in initial Company search");
      // returning an empty object as Posts for the next step in chain
      return Q.when({});
    }
    else if (exactMatch && exactMatch.length) {
      company = exactMatch[0];
      console.log("Found an exact match from Companies search");
    }
    else {
      company = companySearchResults[0];
      console.log("Going with first result from Companies search");
    };
    // ----------------

    // ----------------
    // attach Other Companies to Company object
    // (separate out this as function for testing)
    // ??? should this be here in the chain ???
    var companyNames = companySearchResults.map(function(eachCompany) {
      return eachCompany.name;
    })
    company.otherCompanies = companyNames.filter(function(name){
      return name.toLowerCase() !== userInput.toLowerCase();
    });
    // ----------------

    // TROUBLE STARTING HERE - Async trickiness ...
    console.log("Check-in BEFORE querying Posts of Company");
    return postSearch.findByCompany(company)
  })
  .then(function (posts) {
    console.log("Posts of Company returned in next step of Promise chain: " +JSON.stringify(posts));
    if (!company.noresults) {
      company.posts = posts
    };
    genericResponse.data = company;
    console.log("About to return a Generic Response from within action handler, step 1 of 2");
    return genericResponse;
  });
}

// function attachPostsToCompany(company) {
//   return Q.when(postSearch.findPostsofCompany(company))
//     .then(function (posts) {
//       company.posts = posts;
//       return company;
//     })
// }

module.exports = {
  processRequest: processRequest
};
