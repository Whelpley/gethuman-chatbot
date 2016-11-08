'use strict';

const Q = require('q');
const request = require('request');
const config = require('../config/config');

/**
 * Find all companies that match given text input
 *
 * @param textInput
 * @return {*|promise}
 */
function findByText(textInput) {
  let deferred = Q.defer();
  let url = config.ghApiBaseUrl + '/companies/search';
  let match = encodeURIComponent(textInput);

  console.log('Trying to match user input: ' + match);

  request(url
    + '?match='
    + match,
    function(error, response, body) {
      if (error) {
        deferred.reject(error);
      } else {
        let jsonBody = [];
        try {
          jsonBody = JSON.parse(body);
        } catch (ex) {
          console.log('findByText parsing error for match ' + match + ' with body ' + body);
        }

        deferred.resolve(jsonBody);
      };
  });
  return deferred.promise;
}

module.exports = {
  findByText: findByText
};
