// Checklist:
  // start: can't test
  // addMiddleware: can't test
  // addTestRoutes: can't test (to be deleted anyways)
  // handleRequest: dummy (unsure how to test)
  // sendResponses: (unsure if testable)
  // sendResponseToPlatform: can't test
  // sendRequestAsReply: can't test
  // getContext: (unsure if testable)

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockdata.js');

var serverBrain = require('../bots/messenger.bot');


describe('Brain: Server', function() {

  describe('handleRequest(botHandlers, actionHandlers, config)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

})