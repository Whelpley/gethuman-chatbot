// prepares payloads for Slack responses

'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh');
const utilities = require('../services/utilities');

// new version starter!!!
function addPostsofCompanyToPayload(payload, company) {
  return utilities.queryPostsofCompany(company)
    .then(function (company){
        payload.data = prepareSingleCompanyPayload(company);
        return payload;
    });
}

// 5 Posts Cards, one Company Info Card, one More results card
function prepareSingleCompanyPayload(company) {
    var payloadData = {};
    var phoneAndEmail = utilities.extractTextFieldFromCompany(company);
    var name = company.name;
    var posts = company.posts;
    var otherCompanies = company.otherCompanies;
    var colors = utilities.colors;

    payloadData.username = 'GetHuman';
    payloadData.icon_emoji = ':gethuman:';
    payloadData.attachments = [];

    if (posts) {
        payloadData.text = "Top issues for " + name + ":";
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
                    },
                    // {
                    //     "value": "------------------------------------------------------",
                    //     "short": false
                    // },
                ]
            };
            payloadData.attachments.push(singleAttachment);
        };
    }
    // if no Posts exist for company, prompt for input
    else {
        payloadData.text = "We did not find anything matching the input \"" +name + "\", please try entering the name of the company your are looking for.";
    };
    // attach Company contact info:
    if (phoneAndEmail) {
        payloadData.attachments.push({
            "fallback": "Contact info for " + name,
            "title": "Best way to contact " + name + ":",
            "color": colors[0],
            "text": phoneAndEmail,
        });
    }

    // attach Other Companies info
    // if-conditional: were there others?
    if (otherCompanies && otherCompanies.length) {
        var otherCompaniesList = utilities.convertArrayToBoldList(otherCompanies);
        console.log("Converted Other Companies list: " + otherCompaniesList);
        payloadData.attachments.push({
            "fallback": "Other solutions",
            "title": "Were you talking about " + name + "?",
            "color": colors[1],
            "text": "Or maybe you meant " + otherCompaniesList,
            "mrkdwn_in": ["text"]
        });
    }

    return payloadData;
}


// deprecated
// function addPostsToPayload(payload, posts) {
//   return utilities.queryCompaniesOfPosts(posts)
//     .then(function (posts){
//         payload.data = preparePostsPayload(posts);
//         return payload;
//     });
// }

// deprecated
// function addCompaniesToPayload(payload, companies) {
//     payload.data = prepareCompaniesPayload(companies);
//     return payload;
// }

function nothingFound(payload) {
    payload.data.username = 'Gethuman Bot';
    payload.data.text = "We could not find anything matching your input to our database. Could you tell me what company you are looking to contact?";
    payload.data.icon_emoji = ':gethuman:';
    return payload;
};

function inputPrompt(payload) {
    payload.data.username = 'Gethuman Bot';
    payload.data.text = "Tell me the company you would like to contact.";
    payload.data.icon_emoji = ':gethuman:';
    return payload;
};

function error(error) {
    var payload = {};
    payload.username = 'Gethuman';
    payload.text = error;
    payload.icon_emoji = ':gethuman:';
    return payload;
};

// To be deprecated
// function preparePostsPayload(posts) {
//     var payload = {};
//     payload.username = 'GetHuman';
//     // should this specifically reference the input?
//     payload.text = "Here are some issues potentially matching your input, and links for how to resolve them:";
//     payload.icon_emoji = ':gethuman:';
//     payload.attachments = [];

//     for (let i = 0; i < posts.length; i++) {
//         let name = posts[i].companyName || '';
//         let color = colors[i];
//         let urlId = posts[i].urlId || '';
//         let title = posts[i].title || '';
//         if (title.indexOf(name) < 0) {
//             title = name + ": " + title;
//         };
//         let textField = utilities.extractTextFieldFromPost(posts[i]);
//         let singleAttachment = {
//             "fallback": "Solution guide for " + name,
//             "title": title,
//             "color": color,
//             "text": textField,
//             "fields": [
//                 {
//                     "value": "------------------------------------------------------",
//                     "short": false
//                 },
//                 {
//                     "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|Step by Step Guide>",
//                     "short": true
//                 },
//                 {
//                     "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve for me - $20>",
//                     "short": true
//                 }
//             ]
//         };
//         payload.attachments.push(singleAttachment);
//     };
//     return payload;
// };

// to be deprecated
// function prepareCompaniesPayload(companies) {
//     var payload = {};
//     payload.username = 'Gethuman Bot';
//     payload.text = "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:";
//     payload.icon_emoji = ':flashlight:';
//     payload.attachments = [];

//     for (let i=0; i < companies.length; i++) {
//         let name = companies[i].name || '';
//         let color = colors[i];
//         let textField = utilities.extractTextFieldFromCompany(companies[i]);
//         let singleAttachment = {
//             "fallback": "Company info for " + name,
//             "title": name,
//             "color": color,
//             "text": textField,
//             "fields": [
//                 {
//                     "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Hire GetHuman to Solve - $20>",
//                     "short": true
//                 }
//             ]
//         };
//         payload.attachments.push(singleAttachment);
//     };
//     return payload;
// }

module.exports = {
  // addPostsToPayload: addPostsToPayload,
  // addCompaniesToPayload: addCompaniesToPayload,
  nothingFound: nothingFound,
  inputPrompt: inputPrompt,
  error: error,
  addPostsofCompanyToPayload: addPostsofCompanyToPayload
}

