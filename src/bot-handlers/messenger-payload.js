// prepares payloads for FB Messenger responses

'use strict'

const Q = require('q');
const companySearch = require('../services/company-api-gh.js');
const phoneFormatter = require('phone-formatter');
const utilities = require('../services/utilities.js');

// new version starter!!!
function addPostsofCompanyToObj(responseObj, company) {
  // attached associated top Posts of input Company
  return utilities.queryPostsofCompany(company)
    .then(function (company){
        responseObj.payloads = preparePayloadsOfObj(company);
        return responseObj;
    });
}

// has incoming Company object, with Posts and OtherCompanies attached
// loads payloads as an array, each will trigger a response
function preparePayloadsOfObj(company) {
    var payloads = [];

    var phoneAndEmail = utilities.extractTextFieldFromCompany(company);
    var posts = company.posts;
    var otherCompanies = company.otherCompanies;
    var name = company.name;
    var email = company.email || '';
    var phone = company.phone || '';
    var phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';

// if Posts exist, send Post info cards
    if (posts) {
      var postElements = [];
    // Needs starter card: "Top Issues"
      for (let i = 0; i < posts.length; i++) {
        let title = posts[i].title || '';
        let urlId = posts[i].urlId || ''
        let singleElement = {
            "title": "Top issues for " + name + ", #" + i " of " posts.length +":",
            "subtitle": title,
            "buttons": [{
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
                "title": "Solve for Me - $20"
            },
            {
                "type": "web_url",
                "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
                "title": "More Info ..."
            }],
        };
        postElements.push(singleElement);
      }
      console.log("Post Elements prepared: " + JSON.stringify(postElements));
      payloads.push(postElements);
    }

    // make Company Info Card
    // should it return anything if no phone or email found?
    if (phoneIntl || email) {
        var companyInfoElement = [{
            "title": "Contact info for " + name + ":",
            "subtitle": email || ''
        }];
        //
        if (phoneIntl) {
            companyInfoElement.buttons = [{
                "type": "phone_number",
                "title": "Call " + name,
                "payload": phoneIntl
            }];
        };
        console.log("Company Info Element prepared: " + JSON.stringify(companyInfoElement));
        payloads.push(companyInfoElement);
    }

    // make Other Companies Card
    if (otherCompanies) {
        var otherCompaniesElement = [{
            "title": "Were you trying to reach " + name + "?",
            "subtitle": "These buttons will eventually trigger a new search for you in Messenger",
            "buttons": [],
        }];
        // change these to a Postback to trigger a new search with altCompany as user input
        otherCompanies.forEach(function(altCompany){
            otherCompaniesElement.buttons.push({
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(altCompany),
                "title": altCompany
            })
        })
        console.log("Other Companies Element prepared: " + JSON.stringify(otherCompaniesElement));
        payloads.push(otherCompaniesElement);
    }

    return payloads;
}

// deprecated
// function addPostsToPayload(payload, posts) {
//   return utilities.queryCompaniesOfPosts(posts)
//     .then(function (posts){
//         payload.data = preparePostsPayload(posts);
//         console.log ("About to return a POSTS payload: " + JSON.stringify(payload));
//         return payload;
//     });
// }

// deprecated
// function addCompaniesToPayload(payload, companies) {
//     payload.data = prepareCompaniesPayload(companies);
//     console.log ("About to return a POSTS payload: " + JSON.stringify(payload));

//     return payload;
// }

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
    console.log ("About to return a NOTHING FOUND payload: " + JSON.stringify(payload));

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

// deprecated
// function preparePostsPayload(posts) {
//     console.log("About to form payload from POSTS");
//     let elements = [];
//     for (let i = 0; i < posts.length; i++) {
//         let companyName = posts[i].companyName || '';
//         let urlId = posts[i].urlId || '';
//         let phone = (posts[i].company && posts[i].company.callback) ? posts[i].company.callback.phone : '';
//         // need another check to see if phone # is legit - FB cares!
//         let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
//         let title = posts[i].title || '';
//         if (title.indexOf(companyName) < 0) {
//             title = companyName + ": " + title;
//         };
//         let textField = utilities.extractTextFieldFromPost(posts[i]);

//         let singleElement = {
//             "title": title,
//             "subtitle": textField,
//             "buttons": [{
//                 "type": "web_url",
//                 "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
//                 "title": "Step by Step Guide"
//             }, {
//                 "type": "web_url",
//                 "url": "https://gethuman.com?company=" + encodeURIComponent(companyName) ,
//                 "title": "Solve for Me - $20"
//             }],
//         };
//         // if there is a valid phone # (needs stricter checks), add Call button
//         if (phoneIntl) {
//             singleElement.buttons.unshift({
//                 "type": "phone_number",
//                 "title": "Call " + companyName,
//                 "payload": phoneIntl
//             })
//         };
//         elements.push(singleElement);
//     };
//     console.log("Elements for POSTS payload: " + JSON.stringify(elements));
//     return elements;
// }

// deprecated
// function prepareCompaniesPayload(companies) {
//     // console.log("Hitting the prepareCompaniesPayload function with these companies: " + JSON.stringify(companies).substring(0,200));

//     let elements = [];
//     for (let i = 0; i < companies.length; i++) {
//         let name = companies[i].name || '';
//         let email = companies[i].email || '';
//         let phone = companies[i].phone || '';
//         //format phone# for international format
//         let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
//         let textField = utilities.extractTextFieldFromCompany(companies[i]);
//         let singleElement = {
//             "title": name,
//             "subtitle": textField,
//             "buttons": [
//             {
//                 "type": "web_url",
//                 "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
//                 "title": "Solve for me  - $20"
//             }],
//         };
//         // if there is a valid phone # (needs stricter checks), add Call button
//         if (phoneIntl) {
//             singleElement.subtitle = phone + ",\n" + email,
//             singleElement.buttons.unshift({
//                 "type": "phone_number",
//                 "title": "Call " + name,
//                 "payload": phoneIntl
//             })
//         };
//         elements.push(singleElement);
//     };
//     return elements;
// }

module.exports = {
  // addPostsToPayload: addPostsToPayload,
  // addCompaniesToPayload: addCompaniesToPayload,
  nothingFound: nothingFound,
  error: error,
  addPostsofCompanyToObj: addPostsofCompanyToObj
}