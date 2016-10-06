'use strict'

const Q = require('q');
const request = require('request');

module.exports = {
  findByText: findByText,
}

//takes input text, queries Posts API, returns Promise of Posts object
function findByText(textInput) {
  console.log("Running Post Find-by-Text search");
  var deferred = Q.defer();
  // var url = getUrl();
  // var url = 'https://api.gethuman.co/v3/posts/search';
  var url = 'http://api.gethuman.co/v3/posts/search';

  var match = encodeURIComponent(textInput);
  var limit = 5;
  var filters = encodeURIComponent(JSON.stringify({
        type: 'question',
        isGuide: true
    }));
  request(url
    + '?match='
    + match
    + '&limit='
    + limit
    + '&filterBy='
    + encodeURIComponent(JSON.stringify(filters)),
    function (error, response, body) {
      if (error) {
          // deferred.reject(new Error(error));
          console.log("Hit an error getting the Posts!");
          deferred.reject(error);
      } else {
          console.log("Managed to hit the Posts API with success!");
          deferred.resolve(JSON.parse(body));
      }
  });
  return deferred.promise;
}


