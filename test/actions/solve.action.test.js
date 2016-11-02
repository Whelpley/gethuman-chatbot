// Checklist:
//   processRequest: dummy (unsure if testable)
//   queryCompany: dummy (unsure if testable)
//   structureGenericResponse: dummy
//   attachOtherCompanies: dummy
//   extractContactMethods: dummy

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var mockData = require('../mockdata.js');

var solveAction = require('../../src/actions/solve.action');


describe('Actions: Solve', function() {

  describe('processRequest(genericRequest)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('queryCompany(genericRequest)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('structureGenericResponse(queryResult)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('attachOtherCompanies(company, companySearchResults, userInput)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

  describe('extractContactMethods(queryResultData)', function() {
    it('dummy test', function() {
      assert.equal(2, 2);
    })
  });

})
