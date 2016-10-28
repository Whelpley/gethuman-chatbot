const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const utilities = require('../services/utilities');

/**
 * Processes generic request
 *
 * @param genericRequest
 * @returns {genericResponse}
 */
function processRequest(genericRequest) {
  var genericResponse = {
    context: commonRequest.context
  };
  var userInput = commonRequest.userInput;

  // todo: do pre-response here
  utilities.preResponse(commonRequest.context);

  if (!userInput) {
    return Q.when(commonResponse);
  }

// this is where things get hairy ...
  var company = {};

  return Q.when(companySearch.findAllByText(userInput))
  .then(function (companySearchResults) {

    // ----------------
    // Pick out Company of interest from search results
    // (separate out this as function for testing - MAYBE?
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === userInput.toLowerCase();
    });
    if (!companySearchResults.length) {
      console.log("Nothing found in initial Company search");
      commonResponse.data = {},
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
    return postSearch.findPostsofCompany(company)
  })
  .then(function (posts) {
    console.log("Check-in AFTER querying Posts of Company, within Promise chain.");
    company.posts = posts;
    genericResponse.data = company;
    console.log("About to return a Generic Response from action handler: " +JSON.stringify(genericResponse).substring(0,200));
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