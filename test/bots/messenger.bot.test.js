// Checklist:
//   verify: dummy (unsure if testable)
//   normalizeRequests: dummy
//   generateResponsePayloads: dummy
//   formatContactButtons: dummy
//   makePayload: dummy
//   loadOtherCompaniesElements: dummy
//   loadContactMethodsElements: dummy
//   loadPostElements: dummy
//   loadNothingFoundElements: dummy

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockData.js');

var messengerBot = require('../../src/bots/messenger.bot');


describe('Bots: Messenger', function() {

  describe('verify(req, res)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('normalizeRequests(context)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('generateResponsePayloads(genericResponse)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadNothingFoundElements() ', function() {
    var noFoElements = messengerBot.loadNothingFoundElements();

    it('happy path', function() {
      assert.equal(noFoElements[0].title, "I didn\’t understand.");
    })
  });

  describe('loadPostElements(posts, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadContactMethodsElements(contactMethods, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadOtherCompaniesElements(otherCompanies, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('formatContactButtons(contactMethods)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('makePayload(token, url, sender, elements)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

})

