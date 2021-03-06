// Checklist:
  // normalizeRequests: dummy
  // generateResponsePayloads: dummy
  // formBasicPayload: dummy
  // loadPostsAttachments: dummy
  // loadContactsAttachments: dummy
  // loadOtherCompaniesAttachments: dummy
  // formatContacts: dummy

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockData.js');

var slackBot = require('../../src/bots/slack.bot');


describe('Bots: Slack', function() {

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

  describe('formBasicPayload(genericResponse)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadPostsAttachments(payloads, posts, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadContactsAttachments(payloads, topContacts, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('loadOtherCompaniesAttachments(payloads, otherCompanies, name)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('formatContacts(contactMethods)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

})