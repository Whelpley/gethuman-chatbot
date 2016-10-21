'use strict'

const Q = require('q');
const request = require('request');
// const config = require('../config/config');

function findPostsofCompany(company) {
  var deferred = Q.defer();
  var url = process.env.API_BASE_URL + '/v3/posts';
  console.log('URL for findPostsofCompany search: ' + url);
  // var url = config.ghApiBaseUrl + '/posts';
  var limit = 5;
  var params = encodeURIComponent(JSON.stringify({
    type: 'question',
    instanceOf: { '$exists': false },
    guideId: { '$exists': true },
    companyId: company._id
  }));
  request(url
    + '?limit='
    + limit
    + '&where='
    + params,
  function (error, response, body) {
    if (error) {
      console.log("Hit an error getting the Posts of a Company!");
      deferred.reject(error);
    }
    else {
        deferred.resolve(JSON.parse(body));
    }
  });
  return deferred.promise;
}

// deprecated
// function findByText(textInput) {
//   var deferred = Q.defer();
//   // var url = getUrl();
//   var url = 'https://api.gethuman.co/v3/posts/search';
//   var match = encodeURIComponent(textInput);
//   var limit = 5;
//   var filters = encodeURIComponent(JSON.stringify({
//         type: 'question',
//         isGuide: true
//     }));
//   request(url
//     + '?match='
//     + match
//     + '&limit='
//     + limit
//     + '&filterBy='
//     + filters,
//   function (error, response, body) {
//       if (error) {
//           console.log("Hit an error getting the Posts!");
//           deferred.reject(error);
//       }
//       else {
//           deferred.resolve(JSON.parse(body));
//       }
//   });
//   return deferred.promise;
// }

module.exports = {
  // findByText: findByText,
  findPostsofCompany: findPostsofCompany
}

