'use strict'

var chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  preparePayload = require('../api/payloads.js'),
  mockData = require('./mockdata.js'),
  posts = mockData.posts,
  companies = mockData.companies,
  colors = mockData.colors;

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
  it('has a colors array', function() {
    assert.lengthOf(mockData.colors, 5);
  });
  it('has valid Companies object', function() {
    assert.equal(companies[0].name, "First Company");
  });
  it('has valid Posts object', function() {
    assert.equal(posts[0].companyName, "First Company");
  });
});

// complex payload testing - happy path

describe('Companies Payload - Happy Path', function() {
  var payload = preparePayload.companies(companies);

  it('has the correct introduction text', function() {
    assert.equal(payload.text, "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:");
  });
  it('has the correct company name', function() {
    assert.equal(payload.attachments[0].title, companies[0].name);
  });
  it('has a correctly formatted phone and email field', function() {
    assert.equal(payload.attachments[0].text, "866-111-1111 | first@first.com");
  });
});

describe('Posts Payload - Happy Path', function() {
  var payload = preparePayload.posts(posts);

  it('has the correct introduction text', function() {
    assert.equal(payload.text, "Here are some issues potentially matching your input, and links for how to resolve them:");
  });
  it('has the correct title', function() {
    assert.equal(payload.attachments[0].title, "First Company: This is the first Post");
  });
  it('has a correctly formatted phone and email field', function() {
    assert.equal(payload.attachments[0].text, "866-111-1111 | first@first.com");
  });
});

// unhappy path - passing in empty object as payloads

describe('Companies Payload - Path of Failure', function() {
  var empty = {};
  var payload = preparePayload.companies(empty);
  // console.log("Payload returned from empty input: " + JSON.stringify(payload));

  it('empty Companies object returns no attachments on payload', function() {
    assert.equal(payload.attachments, '');
  });
});

// is there a situation in which the GH API returns Posts or Companies, but the formatting is incorrect?

// does error handling require integration testing?