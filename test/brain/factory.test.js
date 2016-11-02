// Checklist:
//   getActionHandler: dummy
//   getBotHandler: dummy

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockdata.js');

var factoryBrain = require('../../src/brain/factory');

describe('Brain: Factory', function() {

  describe('getActionHandler(actionHandlers, genericRequest)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('getBotHandler(botHandlers, context)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

})

