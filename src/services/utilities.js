'use strict'

const Q = require('q');
const companySearch = require('./company-api-gh');
const postSearch = require('./post-api-gh');

var colors = ['#6E9E43', '#7BAB50', '#88B85D', '#94C469', '#A1D176', '#AEDE83', '#BBEB90', '#C8F89D', '#D4FFA9', '#E1FFB6', '#EEFFC3'];

function preResponse(context) {
  if (!context.isTest) {
    console.log("Sending a 200 response to client.");
    context.finishResponse();
  }
}

// find the top 5 Posts associated with a Company, attach them to the Company object
function queryPostsofCompany(company) {
  return Q.when(postSearch.findPostsofCompany(company))
    .then(function (posts) {
      // console.log("Results of Posts of Company search: " + JSON.stringify(posts).substring(0,400));
      company.posts = posts;
      return company;
    })
}

// deprecated
// function queryCompaniesOfPosts(posts) {
//     var companyIDs = [];
//     for (let i = 0; i < posts.length; i++) {
//         companyIDs.push(posts[i].companyId);
//     };
//     return Q.when(companySearch.findByIds(companyIDs))
//       .then(function (companies) {
//         var companyTable = {};
//         for (let i = 0; i < companies.length; i++) {
//             companyTable[companies[i]._id] = companies[i];
//         };
//         for (let i = 0; i < posts.length; i++) {
//             let cID = posts[i].companyId;
//             posts[i].company = companyTable[cID];
//         };
//         return posts;
//     })
// }


// deprecated
// function extractTextFieldFromPost(post) {
//     let phone = (post.company && post.company.callback) ? post.company.callback.phone : '';
//     let emailContactMethods = post.company.contactMethods.filter(function (method) {
//         return method.type === "email";
//     });
//     let email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';
//     return formatTextField(phone, email);
// }

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

// convert an arry of strings to one string separated by commas, with each entry *bolded*
function convertArrayToBoldList(arrayOfStrings) {
  var result = '*';
  result = result + arrayOfStrings.join('*, *') + "*";
  return result;
}


module.exports = {
  preResponse: preResponse,
  // queryCompaniesOfPosts: queryCompaniesOfPosts,
  // extractTextFieldFromPost: extractTextFieldFromPost,
  extractTextFieldFromCompany: extractTextFieldFromCompany,
  formatTextField: formatTextField,
  queryPostsofCompany: queryPostsofCompany,
  colors: colors,
  convertArrayToBoldList: convertArrayToBoldList
}
