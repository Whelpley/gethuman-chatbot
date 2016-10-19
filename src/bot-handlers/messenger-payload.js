// prepares payloads for FB Messenger responses

'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh.js');
const phoneFormatter = require('phone-formatter');
const utilities = require('../services/utilities.js');

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
    let elements = [{
        "title": "Nothing found!",
        "subtitle": "We're really sorry!",
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Solve for Me - $20"
        }],
    }];
    console.log("Elements returned for NOTHING FOUND payload: " + JSON.stringify(elements));
    payload.data = elements;
    return payload;
};

// needs checking - not yet tested
function error(error) {
    console.log("About to form up ERROR payload.")
    let elements = [{
        "title": "We ran into an error!",
        "subtitle": error,
        "buttons": [{
            "type": "web_url",
            "url": "https://gethuman.com",
            "title": "Go to GetHuman"
        }],
    }];
    console.log("Elements returned for ERROR payload: " + JSON.stringify(elements));
    return elements;
};

function preparePostsPayload(posts) {
  // console.log("Hitting the preparePostsPayload function with these posts: " + JSON.stringify(posts).substring(0,200));

    let elements = [];
    for (let i = 0; i < posts.length; i++) {
        let companyName = posts[i].companyName || '';
        let urlId = posts[i].urlId || '';
        let phone = (posts[i].company) ? posts[i].company.callback.phone : '';
        // need another check to see if phone # is legit - FB cares!
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let title = posts[i].title || '';
        if (title.indexOf(companyName) < 0) {
            title = companyName + ": " + title;
        };
        let textField = utilities.extractTextFieldFromPost(posts[i]);

        let singleElement = {
            "title": title,
            "subtitle": textField,
            "buttons": [{
                "type": "web_url",
                "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
                "title": "Step by Step Guide"
            }, {
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(companyName) ,
                "title": "Solve for Me - $20"
            }],
        };
        // if there is a valid phone # (needs stricter checks), add Call button
        if (phoneIntl) {
            singleElement.buttons.unshift({
                "type": "phone_number",
                "title": "Call " + companyName,
                "payload": phoneIntl
            })
        };
        elements.push(singleElement);
    };
    // console.log("Elements for POSTS payload: " + JSON.stringify(elements).substring(0,200));
    return elements;
}

function prepareCompaniesPayload(companies) {
    // console.log("Hitting the prepareCompaniesPayload function with these companies: " + JSON.stringify(companies).substring(0,200));

    let elements = [];
    for (let i = 0; i < companies.length; i++) {
        let name = companies[i].name || '';
        let email = companies[i].email || '';
        let phone = companies[i].phone || '';
        //format phone# for international format
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let textField = utilities.extractTextFieldFromCompany(companies[i]);
        let singleElement = {
            "title": name,
            "subtitle": textField,
            "buttons": [
            {
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
                "title": "Solve for me  - $20"
            }],
        };
        // if there is a valid phone # (needs stricter checks), add Call button
        if (phoneIntl) {
            singleElement.subtitle = phone + ",\n" + email,
            singleElement.buttons.unshift({
                "type": "phone_number",
                "title": "Call " + name,
                "payload": phoneIntl
            })
        };
        elements.push(singleElement);
    };
    return elements;
}

module.exports = {
  addPostsToPayload: addPostsToPayload,
  addCompaniesToPayload: addCompaniesToPayload,
  nothingFound: nothingFound,
  error: error
}