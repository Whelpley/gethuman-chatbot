// checklist
// ------------
// addCompaniesToPayload(payload, companies)
// nothingFound(payload) X
// inputPrompt(payload) X
// error(error)
// preparePostsPayload(posts)
// prepareCompaniesPayload(companies)
// extractTextFieldFromPost(post)
// extractTextFieldFromCompany(company)
// formatTextField(phone, email)

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var preparePayload = require('../../src/bot-handlers/slack-payload.js');
var mockData = require('../mockData.js');

describe('Input Prompt Payload', function() {
  it('should prompt user for issue', function() {
    var payload = mockData.blankPayload;
    payload = preparePayload.inputPrompt(payload);

    assert.equal(payload.data.text, "Tell me your customer service issue.");
  });
});

describe('Nothing Found Notice Payload', function() {
  it('inform user that there are no matches to input', function() {
    var payload = mockData.blankPayload;
    payload = preparePayload.nothingFound(payload);

    assert.equal(payload.data.text, "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?");
  });
});

describe('Error Notice Payload', function() {
  it('passes through an error', function() {
    var error = "There was a problem, oh no!";
    var payload = preparePayload.error(error);

    assert.equal(payload.text, "There was a problem, oh no!");
  });
});



