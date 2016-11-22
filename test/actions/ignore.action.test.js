// Checklist:
// processRequest - dummy (unsure if testable)

// how to test an asynchronous function?

'use strict'

var chai = require('chai');
var Q = require('q');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockdata.js');

var ignoreAction = require('../../src/actions/ignore.action');


describe('Actions: Ignore', function() {

  describe('processRequest(genericRequest)', function() {
    var normalIgnoreRequest = mockData.getNormalizedRequestIgnore();

    it('happy path', function() {
      assert.equal(ignoreAction.processRequest(normalIgnoreRequest), Q.when(false));
    })
  });

});



