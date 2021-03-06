
const Q = require('q');
const request = require('request');
const config = require('../config/config');

/**
 * Find top 5 Posts that match given Company object
 *
 * @param company
 * @return {*|promise}
 */
function findByCompany(company) {
  let deferred = Q.defer();
  let url = config.ghApiBaseUrl + '/posts';
  let limit = 5;
  let params = encodeURIComponent(JSON.stringify({
    type: 'question',
    instanceOf: {'$exists': false},
    guideId: {'$exists': true},
    companyId: company._id
  }));
  request(url
    + '?limit='
    + limit
    + '&where='
    + params,
  function(error, response, body) {
    if (error) {
      deferred.reject(error);
    } else {
        let jsonBody = [];
        try {
          jsonBody = JSON.parse(body);
        } catch (ex) {
          console.log('findByCompany parsing error for match with body: ' + body);
        }
      deferred.resolve(jsonBody);
    }
  });
  return deferred.promise;
}

module.exports = {
  findByCompany: findByCompany
};
