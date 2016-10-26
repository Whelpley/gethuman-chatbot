'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh.js');
const utilities = require('../services/utilities.js');

// Repeated function, different end function
function loadCompanyToObj(responseObj, company) {
  return utilities.queryPostsofCompany(company)
    .then(function (company){
        responseObj.payloads = preparePayloadsOfObj(company);
        return responseObj;
    });
}

// has incoming Company object, with Posts and OtherCompanies attached
// loads payloads as an array, each will trigger a response
// (sub-loading functions should go to separate functions for testability)
function preparePayloadsOfObj(company) {
    var payloads = [];

    var posts = company.posts;
    var otherCompanies = company.otherCompanies;
    var name = company.name;

    var contactInfo = utilities.extractContactInfo(company);

    if (posts && posts.length) {
    // if Posts exist, send Post info cards
      var postElements = [];
      for (let i = 0; i < posts.length; i++) {
        let text = posts[i].title || '';
        let urlId = posts[i].urlId || ''
        let singleElement = {
            "title": "Top issues for " + name + ", #" + (i+1) + " of " + posts.length + ":",
            "subtitle": text,
            "buttons": [{
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
                "title": "Solve this for Me - $20"
            },
            {
                "type": "web_url",
                "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
                "title": "More info ..."
            }],
        };
        postElements.push(singleElement);
      }
      console.log("Post Elements prepared: " + JSON.stringify(postElements));
      console.log(payloads);
      payloads.push(postElements);
    }

    // make Company Info Card
    var companyInfoElement = [{
        "title": "Best ways to contact " + name + ":",
        'buttons': utilities.formatContactButtonsMessenger(contactInfo)
    }];
    // only push in if at least one button exists:
    if (companyInfoElement.buttons.length) {
        console.log("Company Info Element prepared: " + JSON.stringify(companyInfoElement));
        payloads.push(companyInfoElement);
    };

    // make Other Companies Card
    // To-Do: Make buttons trigger a Postback to do another search/reply
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesElement = [{
            "title": "Were you trying to reach " + name + "?",
            "subtitle": "Perhaps you would like to ask me about these companies:",
            "buttons": [],
        }];
        // change these to a Postback to trigger a new search with altCompany as user input
        // cull down Other Options to 3 - could make more scrolling cards if wanted...
        var otherCompaniesSubSet = otherCompanies.slice(0,3);
        otherCompaniesSubSet.forEach(function(altCompany){
            otherCompaniesElement[0].buttons.push({
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(altCompany),
                "title": altCompany
            })
        })
        console.log("Other Companies Element prepared: " + JSON.stringify(otherCompaniesElement));
        payloads.push(otherCompaniesElement);
    }

    // check if nothing is in payload at this point - return NothingFound payload if so
    if (!payloads.length) {
        payloads.push([{
            "title": "Nothing found!",
            "subtitle": "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")",
            "buttons": [{
                "type": "web_url",
                "url": "https://gethuman.com",
                "title": "Solve this for Me - $20"
            }],
        }])
    }
    // console.log("All payload elements prepared: " + JSON.stringify(payloads));
    return payloads;
}

function nothingFound(responseObj) {
    var textInput = responseObj.context.textInput;

    let nothingFoundElement = [[{
        "title": "Nothing found!",
        "subtitle": "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"Verizon Wireless\")",
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Solve this for Me - $20"
        }],
    }]];
    responseObj.payloads = nothingFoundElement;
    console.log ("Loading a NOTHING FOUND payload into response object");
    return responseObj;
};

// needs checking - not yet tested
// Should button go elsewhere?
function error(error) {
    console.log("About to form up ERROR payload.")
    let elements = [{
        "title": "We ran into an error!",
        "subtitle": JSON.stringify(error),
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman"
        }],
    }];
    console.log("Elements returned for ERROR payload: " + JSON.stringify(elements));
    return elements;
};

module.exports = {
  nothingFound: nothingFound,
  error: error,
  loadCompanyToObj: loadCompanyToObj
}