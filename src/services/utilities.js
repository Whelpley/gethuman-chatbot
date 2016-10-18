'use strict'

const Q = require('q');
const companySearch = require('./company-api-gh.js');
const postSearch = require('./post-api-gh.js');

function preResponse(context) {
  // shoot back an immediate Status 200 to let client know it's all cool
  // (much pain if neglected)
  if (!context.isTest) {
    context.finishResponse();
  }
}

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

module.exports = {
  preResponse: preResponse,
  queryCompaniesOfPosts: queryCompaniesOfPosts,
  extractTextFieldFromPost: extractTextFieldFromPost,
  extractTextFieldFromCompany: extractTextFieldFromCompany,
  formatTextField: formatTextField
}
