'use strict'

const Q = require('q');
const request = require('request');
// const config = require('../config/config');

function findAllByText(textInput) {
  var deferred = Q.defer();
  var url = process.env.API_BASE_URL + '/companies/search';
  // var url = config.ghApiBaseUrl + '/companies/search';
  var match = encodeURIComponent(textInput);

  console.log('trying to match user input: ' + match)

  request(url
    + '?match='
    + match,
    function (error, response, body) {
      if (error) {
          deferred.reject(error);
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}

module.exports = {
  findAllByText: findAllByText
}