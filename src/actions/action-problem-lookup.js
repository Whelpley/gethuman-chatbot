'use strict'

const request = require('request');
const Q = require('q');
const companySearch = require('../services/company-api-gh');
const postSearch = require('../services/post-api-gh');
const utilities = require('../services/utilities');

// takes common request, returns Object with Data (Company Object) and Context
function processRequest(commonRequest) {
  var commonResponse = {
    context: commonRequest.context
  };
  var userInput = commonRequest.userInput;

// should this be a Promise?
  if (!userInput) {
    return Q.when(commonResponse);
  }

  return Q.when(companySearch.findAllByText(userInput))
  .then(function (companySearchResults) {
    var company = {};

    // separate out this as function for testing
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === userInput.toLowerCase();
    });
    if (!companySearchResults.length) {
      console.log("Nothing found in initial Company search");
      return Q.when(company);
    }
    else if (exactMatch && exactMatch.length) {
      company = exactMatch[0];
      console.log("Found an exact match from Companies search");
    }
    else {
      company = companySearchResults[0];
      console.log("Going with first result from Companies search");
    };

    // attach Other Companies to Company object
    // separate out this as function for testing
    var companyNames = companySearchResults.map(function(eachCompany) {
      return eachCompany.name;
    })
    company.otherCompanies = companyNames.filter(function(name){
      return name.toLowerCase() !== userInput.toLowerCase();
    });
    console.log("Other companies filtered from input:" + JSON.stringify(company.otherCompanies));

    return attachPostsToCompany(company)
  })
// passes down a Company object
  .then(function (company) {
    commonResponse.data = company,
    console.log("About the return a Common Response from action handler: " +JSON.stringify(commonResponse).substring(0,400));
    return commonResponse;
  });
}

function attachPostsToCompany(company) {
  return Q.when(postSearch.findPostsofCompany(company))
    .then(function (posts) {
      company.posts = posts;
      return company;
    })
}

module.exports = {
  processRequest: processRequest
};
