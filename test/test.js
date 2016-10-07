// make a test that posts the slash command to /gethuman, get a 200 status

// var expect  = require("chai").expect;
// var request = require("request");

var chai = require('chai'),
  assert = chai.assert,
  preparePayload = require('../api/payloads.js');

// const mockPosts = [
//   {
//     companyName: "First Company",
//     urlID: AAAA,
//     title: "This is the first Post",
//     company: {

//     },

//   }

// ]


describe('Array', function() {
  it('should start empty', function() {
    var arr = [];

    assert.equal(arr.length, 0);
  });
});