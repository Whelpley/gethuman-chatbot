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

// needs a mock data object for queryResultData

  describe('extractContactMethods(queryResultData)', function() {
    var qrData = mockData.getQueryResultData();
    var junk = mockData.getJunkObject();

    var emptyReturn = solveAction.extractContactMethods();
    var goodReturn = solveAction.extractContactMethods(qrData);
    var junkReturn = solveAction.extractContactMethods(junk);

    it('dummy test', function() {
      assert.equal(2, 2);
    })

    it('empty input', function() {
      assert.equal(emptyReturn.phone, '');
    })

    it('happy path', function() {
      assert.equal(goodReturn.phone, '666-666-6666');
    })

    it('fail path', function() {
      assert.equal(junkReturn.phone, '');
    })

  });

})
