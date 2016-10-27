// prepares payloads for Slack responses

'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh');
const utilities = require('../services/utilities');

// Repeated function, different end function
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
    var name = company.name;
    var posts = company.posts;
    var otherCompanies = company.otherCompanies;
    var colors = utilities.colors;

    var contactInfo = utilities.extractContactInfo(company);
    var topContacts = utilities.formatTextFieldSlack(contactInfo);

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
            let color = colors[i];
            let singleAttachment = {
                "fallback": "Issue for " + name,
                "title": title,
                "color": color,
                "fields": [
                    {
                        "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve this for me - $20>",
                        "short": true
                    },
                    {
                        "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|More info ...>",
                        "short": true
                    }
                ]
            };
            payloads[0].attachments.push(singleAttachment);
        };
    }

    // attach Company contact info:
    // ... needs other company contact methods
    payloads[0].attachments.push({
        "fallback": "Contact info for " + name,
        "title": "Best ways to contact " + name + ":",
        "color": '#999999',
        "text": topContacts,
    });

    // attach Other Companies info if they exist
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesList = utilities.convertArrayToBoldList(otherCompanies);
        console.log("Converted Other Companies list: " + otherCompaniesList);
        payloads[0].attachments.push({
            "fallback": "Other solutions",
            "title": "Were you talking about " + name + "?",
            "color": '#BBBBBB',
            "text": "Or maybe you meant " + otherCompaniesList + "?",
            "mrkdwn_in": ["text"]
        });
    }

    // check if nothing is in payload at this point - return NothingFound payload if so
    if (!payloads[0].attachments.length) {
        payloads[0].text = "I couldn't find anything for \"" + name + "\". Please tell me which company you are looking for. (ex: \"/gethuman Verizon Wireless\")"
    }
    console.log("About to return this Slack payload for sending: " + JSON.stringify(payloads));
    return payloads;
}

// unique function
function nothingFound(responseObj) {
    var textInput = responseObj.context.userRequest.text;
    responseObj.payloads = [{
        username: 'GetHuman',
        text: "I couldn't tell what you meant by \"" + textInput + "\". Please tell me company you are looking for. (ex: \"/gethuman Verizon Wireless\")",
        icon_emoji: ':gethuman:',
        response_type: 'ephemeral'
    }]
    return responseObj;
};

// unique function
function inputPrompt(responseObj) {
    responseObj.payloads = [{
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

