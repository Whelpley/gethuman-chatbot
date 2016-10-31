'use strict'

var Q = require('q');
var request = require('request');
var config = require('../config/config');

/**
 * Find all companies that match given text input
 *
 * @param textInput
 * @return {*|promise}
 */
function findByText(textInput) {
  var deferred = Q.defer();
  var url = config.ghApiBaseUrl + '/companies/search';
  var match = encodeURIComponent(textInput);

  console.log('Trying to match user input: ' + match);

  request(url
    + '?match='
    + match,
    function(error, response, body) {
      if (error) {
          deferred.reject(error);
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}

module.exports = {
  findByText: findByText
};
