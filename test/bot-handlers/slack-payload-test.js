// checklist
// ------------


'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var preparePayload = require('../../src/bot-handlers/slack-payload.js');
var mockData = require('../mockData.js');

// describe('Input Prompt Payload', function() {
//   it('should prompt user for issue', function() {
//     // var payload = mockData.getBlankPayload();

//     var payload = mockData.blankPayload;
//     payload = preparePayload.inputPrompt(payload);

//     assert.equal(payload.data.text, "Tell me your customer service issue.");
//   });
// });

// describe('Nothing Found Notice Payload', function() {
//   it('inform user that there are no matches to input', function() {
//     var payload = mockData.blankPayload;
//     payload = preparePayload.nothingFound(payload);

//     assert.equal(payload.data.text, "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?");
//   });
// });

// describe('Error Notice Payload', function() {
//   it('passes through an error', function() {
//     var error = "There was a problem, oh no!";
//     var payload = preparePayload.error(error);

//     assert.equal(payload.text, "There was a problem, oh no!");
//   });
// });

// // // complex payload testing - happy path

// describe('Companies Payload - Happy Path', function() {
//   var companies = mockData.companies;
//   var payload = mockData.blankPayload;
//   payload = preparePayload.addCompaniesToPayload(payload, companies);

// // strange variable-scoping behavior
//   it('has the correct introduction text', function() {
//     assert.equal(payload.data.text, "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:");
//   });
//   it('has the correct company name', function() {
//     assert.equal(payload.data.attachments[0].title, companies[0].name);
//   });
//   it('has a correctly formatted phone and email field', function() {
//     assert.equal(payload.data.attachments[0].text, "866-111-1111 | first@first.com");
//   });
// });



