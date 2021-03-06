var Q = require('q');

var companySearch = require('../services/company-api-gh');
var postSearch = require('../services/post-api-gh');

/**
 * Processes generic request into Company object, with attached data
 *
 * @param genericRequest
 * @return {genericResponse} Promise
 */
function processRequest(normalizedRequest) {

  /*
  TODO: Insert conditional: if Env variables not accessible (ie someone else has copied & is using this code), queryCompany should return a mock object
  */
  if (!normalizedRequest.context.config || !normalizedRequest.context.config.environment) {
    var context = normalizedRequest.context;
    var mockGenericResponse = mockData.getGenericResponse(context);
    return Q.when(mockGenericResponse);
  }

  // get data from Gethuman, then process into generic response
  return Q.when(queryCompany(normalizedRequest))
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
    type: '',
    context: genericRequest.context
  };
  var company = {};
  var userInput = genericRequest.userInput;
  var requestType = genericRequest.reqType;

  if (!userInput) {
    queryResult.type = 'no-input';
    return Q.when(queryResult);
  }

  if (requestType === 'help') {
    queryResult.type = 'help';
    return Q.when(queryResult);
  }

  if (requestType === 'greeting') {
    queryResult.type = 'greeting';
    return Q.when(queryResult);
  };

  return companySearch.findByText(userInput)
  .then(function(companySearchResults) {
    // If nothing passed in, return an empty object in place of Posts
    // to next step in Promise chain
    if (!companySearchResults.length) {
      queryResult.type = 'nothing-found';
      return Q.when({});
    }

    queryResult.type = 'standard';

    let exactMatch = companySearchResults.filter(eachCompany => eachCompany.name.toLowerCase() === userInput.toLowerCase());

    company = (exactMatch && exactMatch.length) ? exactMatch[0] : companySearchResults[0];
    company = attachOtherCompanies(company, companySearchResults, userInput);

    return postSearch.findByCompany(company);
  })
  .then(function(posts) {
    company.posts = posts;
    queryResult.data = company;
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
  var {type, data, userInput} = queryResult;
  var posts = data.posts || [];
  var genericResponse = {
    userInput: userInput,
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

  // return early if no data or no input or Help or Greeting
  if ((type === 'no-input')
    || (type === 'nothing-found')
    || (type === 'help')
    || (type === 'greeting')) {
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
    var userInputLower = userInput.toLowerCase();
    var companyNames = companySearchResults.map((eachCompany) => {
      return eachCompany.name;
    });

    company.otherCompanies = companyNames.filter(n => n.toLowerCase() !== userInputLower);

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

  if (!(company) || !(company.contactMethods)) return contactMethods;

  company.contactMethods.forEach(function(method) {
      contactMethods[method.type] = method.target;
  });
  return contactMethods;
}

module.exports = {
  processRequest: processRequest,
  extractContactMethods: extractContactMethods,
  attachOtherCompanies: attachOtherCompanies,
  structureGenericResponse: structureGenericResponse,
  queryCompany: queryCompany
};
