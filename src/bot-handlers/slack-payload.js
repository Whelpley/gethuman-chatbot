// prepares payloads for Slack responses

'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh');
const utilities = require('../services/utilities');

// Repeated function
function loadCompanyToObj(responseObj, company) {
  return utilities.queryPostsofCompany(company)
    .then(function (company){
        responseObj.payloads = preparePayloadsOfObj(company);
        return responseObj;
    });
}

// 5 Posts Cards, one Company Info Card, one More results card
// Unique function
function preparePayloadsOfObj(company) {
    var phoneAndEmail = utilities.extractTextFieldFromCompany(company);
    var name = company.name;
    var posts = company.posts;
    var otherCompanies = company.otherCompanies;
    var colors = utilities.colors;

    var payloads = [{
        username: 'GetHuman',
        icon_emoji: ':gethuman:',
        // set response_type to 'in_channel' if we want all to see it
        response_type: 'ephemeral',
        attachments: []
    }];

    if (posts && posts.length) {
        payloads[0].text = "Top issues for " + name + ":";
        for (let i = 0; i < posts.length; i++) {
            let title = posts[i].title || '';
            let urlId = posts[i].urlId || ''
            let color = colors[i+2];
            let singleAttachment = {
                "fallback": "Issue for " + name,
                "title": title,
                "color": color,
                "fields": [
                    {
                        "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve for me - $20>",
                        "short": true
                    },
                    {
                        "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|More Info ...>",
                        "short": true
                    }
                ]
            };
            payloads[0].attachments.push(singleAttachment);
        };
    }
    else {
    // if no Posts exist for company, prompt for input
        payloads[0].text = "We did not find any issues matching the input \"" +name + "\", please try entering the name of the company your are looking for.";
    };

    // attach Company contact info:
    if (phoneAndEmail) {
        payloads[0].attachments.push({
            "fallback": "Contact info for " + name,
            "title": "Best way to contact " + name + ":",
            "color": colors[0],
            "text": phoneAndEmail,
        });
    }

    // attach Other Companies info if they exist
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesList = utilities.convertArrayToBoldList(otherCompanies);
        console.log("Converted Other Companies list: " + otherCompaniesList);
        payloads[0].attachments.push({
            "fallback": "Other solutions",
            "title": "Were you talking about " + name + "?",
            "color": colors[1],
            "text": "Or maybe you meant " + otherCompaniesList,
            "mrkdwn_in": ["text"]
        });
    }

    return payloads;
}

// unique function
function nothingFound(responseObj) {
    responseObj.payload = [{
        username: 'GetHuman',
        text: "We could not find anything matching your input to our database. Could you tell me what company you are looking to contact?",
        icon_emoji: ':gethuman:',
        response_type: 'ephemeral'
    }]
    return responseObj;
};

// unique function
function inputPrompt(responseObj) {
    responseObj.payload = [{
        username: 'GetHuman',
        text: "Tell me the company you would like to contact.",
        response_type: 'ephemeral',
        icon_emoji: ':gethuman:'
    }]
    return responseObj;
};

// unique function
function error(error) {
    return {
        username: 'GetHuman',
        text: error,
        icon_emoji: ':gethuman:'
    };
};

module.exports = {
  nothingFound: nothingFound,
  inputPrompt: inputPrompt,
  error: error,
  loadCompanyToObj: loadCompanyToObj
}

