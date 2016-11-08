'use strict';

var Q = require('q');
var companySearch = require('../services/company-api-gh');
var postSearch = require('../services/post-api-gh');
// var utilities = require('../brain/utilities');

/**
 * Processes generic request into Company object, with attached data
 *
 * @param genericRequest
 * @return {genericResponse} Promise
 */
function processRequest(genericRequest) {
  // // send back a 200 response immediately
  // utilities.preResponse(genericRequest.context);
  // get data from Gethuman, then process into generic response
  return Q.when(queryCompany(genericRequest))
    .then((queryResult) => {
      return structureGenericResponse(queryResult);
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
    data: {},
    // types: 'standard', 'no-input', 'not-found'
    type: '',
    context: genericRequest.context
  };
  var company = {};
  var userInput = genericRequest.userInput;
  var requestType = genericRequest.reqType;
  console.log('Incoming request type from genericRequest, in queryCompany: ' + requestType);

  if (!userInput) {
    queryResult.type = 'no-input';
    return Q.when(queryResult);
  } else if (requestType === 'help') {
    console.log('Help type detected in queryCompany function');
    queryResult.type = 'help';
    return Q.when(queryResult);
  };

  return Q.when(companySearch.findByText(userInput))
  .then(function(companySearchResults) {
    // If nothing passed in, return an empty object in place of Posts
    // to next step in Promise chain
    if (!companySearchResults.length) {
      console.log('Nothing found in initial Company search');
      queryResult.type = 'nothing-found';
      return Q.when({});
    }
    queryResult.type = 'standard';
    var exactMatch = companySearchResults.filter(function(eachCompany) {
      return eachCompany.name.toLowerCase() === userInput.toLowerCase();
    });
    company = (exactMatch && exactMatch.length) ? exactMatch[0] : companySearchResults[0];
    company = attachOtherCompanies(company, companySearchResults, userInput);
    return postSearch.findByCompany(company);
  })
  .then(function(posts) {
    company.posts = posts;
    queryResult.data = company;
    console.log('Result of API queries: ' + JSON.stringify(queryResult).substring(0, 400));
    return queryResult;
  });
}

/**
 * Processes result of API query into common structured data object
 *
 * @param queryResult
 * @return {genericResponse} Promise
 */
function structureGenericResponse(queryResult) {
  var type = queryResult.type;
  var posts = queryResult.data.posts || [];
  var genericResponse = {
    userInput: queryResult.userInput,
    data: {
      name: queryResult.data.name || '',
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
    type: type || '',
    context: queryResult.context || ''
  };

  // return early if no data or no input or Help
  // refactor this
  if ((type === 'no-input') || (type === 'nothing-found') || (type === 'help')) {
    return genericResponse;
  };

// Extract contact methods:
  genericResponse.data.contactMethods = extractContactMethods(queryResult.data);

// Extract Posts info
  if (posts && posts.length) {
    genericResponse.data.posts = posts.map((post) => {
      return {
        title: post.title || '',
        urlId: post.urlId || '',
      };
    });
  };
  return genericResponse;
}

/**
 * Attaches other companies returned from GetHuman query to main company
 *
 * @param company
 * @param companySearchResults
 * @param userInput
 * @return {company}
 */
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

/**
 * Obtains contact methods from result of GetHuman queries
 *
 * @param queryResultData
 * @return {contactMethods}
 */
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
  company.contactMethods.forEach(function(method) {
      contactMethods[method.type] = method.target;
  });
  console.log("Extracted contact info from company: " + JSON.stringify(contactMethods));
  return contactMethods;
}

module.exports = {
  processRequest: processRequest,
  extractContactMethods: extractContactMethods,
  attachOtherCompanies: attachOtherCompanies,
  structureGenericResponse: structureGenericResponse,
  queryCompany: queryCompany
};
