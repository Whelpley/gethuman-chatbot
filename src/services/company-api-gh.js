'use strict'

const Q = require('q');
const request = require('request');

module.exports = {
  findByText: findByText,
  findByIds: findByIds,
  findAllByText: findAllByText
}

function findAllByText(textInput) {
  var deferred = Q.defer();
  // var url = getUrl();
  var url = 'https://api.gethuman.co/v3/companies/search';
  var match = encodeURIComponent(textInput);

  console.log('trying to match ' + match)

  request(url
    + '&match='
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

// Old version - Still used with FBM for now
function findByText(textInput) {
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
          deferred.reject(error);
      } else {
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}

