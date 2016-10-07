'use strict'

var chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  preparePayload = require('../api/payloads.js'),
  mockData = require('./mockdata.js'),
  posts = mockData.posts,
  companies = mockData.companies,
  colors = mockData.colors;

var steve = mockData.steve;

// 'hello world' test
describe('Array', function() {
  it('should start empty', function() {
    var arr = [];
    assert.equal(arr.length, 0);
  });
});

// simple tests

describe('Input Prompt Payload', function() {
  it('should prompt user for issue', function() {
    var payload = preparePayload.inputPrompt();

    assert.equal(payload.text, "Tell me your customer service issue.");
  });
});

describe('Nothing Found Notice Payload', function() {
  it('inform user that there are no matches to input', function() {
    var payload = preparePayload.nothingFound();

    assert.equal(payload.text, "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?");
  });
});

describe('Error Notice Payload', function() {
  it('passes through an error', function() {
    var error = "There was a problem, oh no!"
    var payload = preparePayload.error(error);

    assert.equal(payload.text, "There was a problem, oh no!");
  });
});

// tests vs mock data

describe('Check Mock Data', function() {
  it('has steve', function() {
    assert.typeOf(steve, 'string');
    assert.equal(steve, "Steve");
  });
  it('has a colors array', function() {
    assert.lengthOf(mockData.colors, 5);
  });
  // it('has valid Companies object', function() {
  //   assert.equal(companies[0].name, "First Company");
  // });
});

// describe('Companies Payload', function() {
//   var payload = preparePayload.companies(companies);

//   it('has the correct introduction text', function() {
//     assert.equal(payload.text, "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:");
//   });

// });