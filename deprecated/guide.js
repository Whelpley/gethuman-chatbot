'use strict'

const Q = require('q');
const request = require('request');

module.exports = {
  findByIds: findByIds
}

//takes input array of Guide ID's, queries Companies API, returns Promise of Guides object
function findByIds(guideIds) {
  var deferred = Q.defer();
  // var url = getUrl();
  var url = 'https://api.gethuman.co/v3/guides?where=';
  var params = encodeURIComponent(JSON.stringify({ _id: { $in: guideIds }}));
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

