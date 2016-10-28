const Q = require('q');
const request = require('request');
const config = require('../config/config');

/**
 * Find top 5 Posts that match given Company object
 *
 * @param company
 * @returns {*|promise}
 */

function findByCompany(company) {
  var deferred = Q.defer();
  // var url = process.env.API_BASE_URL + '/posts';
  var url = config.ghApiBaseUrl + '/posts';
  var limit = 5;
  var params = encodeURIComponent(JSON.stringify({
    type: 'question',
    instanceOf: { '$exists': false },
    guideId: { '$exists': true },
    companyId: company._id
  }));
  console.log("About to make request to query Posts");
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

module.exports = {
  findByCompany: findByCompany
};
