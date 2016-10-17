// prepares payloads for FB Messenger responses

'use strict'

const Q = require('q');
const companySearch = require('../api-gh/company.js');
const phoneFormatter = require('phone-formatter');

function addPostsToPayload(payload, posts) {
  return queryCompaniesOfPosts(posts)
    .then(function (posts){
        payload.data = preparePostsPayload(posts);
        payload.raw = payload.data;
        return payload;
    });
}

function addCompaniesToPayload(payload, companies) {
    payload.data = prepareCompaniesPayload(companies);
    payload.raw = payload.data;
    return payload;
}

function nothingFound(payload) {
    console.log("About to form up NOTHING FOUND payload.")
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

    return elements;
};

function error(error) {
    // var payload = {};
    // payload.username = 'Gethuman Bot';
    // payload.text = error;
    // payload.icon_emoji = ':no_good:';
    // return payload;
};

// ----- helper methods


function queryCompaniesOfPosts(posts) {
    var companyIDs = [];
    for (let i = 0; i < posts.length; i++) {
        companyIDs.push(posts[i].companyId);
    };
    return Q.when(companySearch.findByIds(companyIDs))
      .then(function (companies) {
        var companyTable = {};
        for (let i = 0; i < companies.length; i++) {
            companyTable[companies[i]._id] = companies[i];
        };
        for (let i = 0; i < posts.length; i++) {
            let cID = posts[i].companyId;
            posts[i].company = companyTable[cID];
        };
        return posts;
    })
}

function preparePostsPayload(posts) {
  console.log("Hitting the preparePostsPayload function with these posts: " + JSON.stringify(posts).substring(0,200));

    let elements = [];
    for (let i = 0; i < questions.length; i++) {
        let companyName = questions[i].companyName || '';
        let urlId = questions[i].urlId || '';
        let phone = (questions[i].company) ? questions[i].company.callback.phone : '';
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let title = questions[i].title || '';
        if (title.indexOf(companyName) < 0) {
            title = companyName + ": " + title;
        };
        let textField = extractTextFieldFromPost(posts[i]);

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
    console.log("Ermagerd we made some Elements for POSTS payload: " + JSON.stringify(elements));
    return elements
}

function prepareCompaniesPayload(companies) {
  console.log("Hitting the prepareCompaniesPayload function with these companies: " + JSON.stringify(companies).substring(0,200));

  // Need to fill this in!!!
}

// Following methods are duplicated in another module: combine & share!

function extractTextFieldFromPost(post) {
    let phone = (post.company) ? post.company.callback.phone : '';
    let emailContactMethods = post.company.contactMethods.filter(function (method) {
        return method.type === "email";
    });
    let email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';
    return formatTextField(phone, email);
}

function extractTextFieldFromCompany(company) {
    let phone = company.callback.phone || '';
    let emailContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "email";
    });
    let email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';
    return formatTextField(phone, email);
}

function formatTextField(phone, email) {
    let result = '';
    if (phone && email) {
        result = phone + " | " + email;
    } else if (phone) {
        result = phone;
    } else if (email) {
        result = email;
    };
    return result;
};

// ----------------------------------

module.exports = {
  addPostsToPayload: addPostsToPayload,
  addCompaniesToPayload: addCompaniesToPayload,
  nothingFound: nothingFound,
  error: error
}