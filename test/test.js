'use strict'

var chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  preparePayload = require('../api/payloads.js'),
  mockData = require('./mockdata.js'),
  posts = mockData.posts,
  companies = mockData.companies,
  colors = mockData.colors;

// 'hello world' test
describe('Array', function() {
  it('should start empty', function() {
    var arr = [];

    assert.equal(arr.length, 0);
  });
});

// simple test - text of input prompt
describe('Input Prompt', function() {
  it('should prompt user for issue', function() {
    var payload = preparePayload.inputPrompt();

    assert.equal(payload.text, "Tell me your customer service issue.");
  });
});