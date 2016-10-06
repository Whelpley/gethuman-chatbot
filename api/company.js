'use strict'

const Q = require('q');
const request = require('request');

module.exports = {
  findByText: findByText,
  findByIds: findByIds
}

//takes input text, queries Companies API, returns Promise of Companies object
function findByText(textInput) {
  console.log("Running Company Find-by-Text search");
  var deferred = Q.defer();
  // var url = getUrl();
  var url = 'https://api.gethuman.co/v3/companies/search';
  var limit = 5;
  var match = encodeURIComponent(textInput);
  request(url
    + '?limit='
    + limit
    + '&match='
    + match,
    function (error, response, body) {
      if (error) {
          // deferred.reject(new Error(error));
          deferred.reject(error);
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}

//takes input array of Company ID's, queries Companies API, returns Promise of Companies object
function findByIds(companyIds) {
  var deferred = Q.defer();
  // var url = getUrl();
  var url = 'https://api.gethuman.co/v3/companies?where=';
  var params = encodeURIComponent(JSON.stringify({ _id: { $in: companyIds }}));
  request(url + params,
    function (error, response, body) {
      if (error) {
          // deferred.reject(new Error(error));
          deferred.reject(error);
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}

