// prepares payloads for Slack responses

'use strict'

const colors = ['#1c4fff', '#e84778', '#ffc229', '#1ae827', '#5389ff'];
const Q = require('q');
const companySearch = require('../services/company-api-gh.js');
const utilities = require('../services/utilities.js');

// harder to test b/c has an API call!
function addPostsToPayload(payload, posts) {
  return utilities.queryCompaniesOfPosts(posts)
    .then(function (posts){
        payload.data = preparePostsPayload(posts);
        return payload;
    });
}

function addCompaniesToPayload(payload, companies) {
    payload.data = prepareCompaniesPayload(companies);
    return payload;
}

function nothingFound(payload) {
    payload.data.username = 'Gethuman Bot';
    payload.data.text = "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?";
    payload.data.icon_emoji = ':question:';
    return payload;
};

function inputPrompt(payload) {
    payload.data.username = 'Gethuman Bot';
    payload.data.text = "Tell me your customer service issue.";
    payload.data.icon_emoji = ':ear:';
    return payload;
};

function error(error) {
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = JSON.stringify(error);
    payload.icon_emoji = ':no_good:';
    return payload;
};

function preparePostsPayload(posts) {
    var payload = {};
    payload.username = 'Gethuman Bot';
    // should this specifically reference the input?
    payload.text = "Here are some issues potentially matching your input, and links for how to resolve them:";
    payload.icon_emoji = ':tada:';
    payload.attachments = [];

    for (let i = 0; i < posts.length; i++) {
        let name = posts[i].companyName || '';
        let color = colors[i];
        let urlId = posts[i].urlId || '';
        let title = posts[i].title || '';
        if (title.indexOf(name) < 0) {
            title = name + ": " + title;
        };
        let textField = utilities.extractTextFieldFromPost(posts[i]);
        let singleAttachment = {
            "fallback": "Solution guide for " + name,
            "title": title,
            "color": color,
            "text": textField,
            "fields": [
                {
                    "value": "------------------------------------------------------",
                    "short": false
                },
                {
                    "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|Step by Step Guide>",
                    "short": true
                },
                {
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve for me - $20>",
                    "short": true
                }
            ]
        };
        payload.attachments.push(singleAttachment);
    };
    return payload;
};

function prepareCompaniesPayload(companies) {
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:";
    payload.icon_emoji = ':flashlight:';
    payload.attachments = [];

    for (let i=0; i < companies.length; i++) {
        let name = companies[i].name || '';
        let color = colors[i];
        let textField = utilities.extractTextFieldFromCompany(companies[i]);
        let singleAttachment = {
            "fallback": "Company info for " + name,
            "title": name,
            "color": color,
            "text": textField,
            "fields": [
                {
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Hire GetHuman to Solve - $20>",
                    "short": true
                }
            ]
        };
        payload.attachments.push(singleAttachment);
    };
    return payload;
}

module.exports = {
  addPostsToPayload: addPostsToPayload,
  addCompaniesToPayload: addCompaniesToPayload,
  nothingFound: nothingFound,
  inputPrompt: inputPrompt,
  error: error
}

