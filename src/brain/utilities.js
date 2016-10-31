'use strict'

var Q = require('q');
// var phoneFormatter = require('phone-formatter');

// GetHuman green palette
const colors = [
    '#6E9E43',
    '#7BAB50',
    '#88B85D',
    '#94C469',
    '#A1D176',
    '#AEDE83',
    '#BBEB90',
    '#C8F89D',
    '#D4FFA9',
    '#E1FFB6',
    '#EEFFC3'
];

// anything you want all bots to do before processing request
function preResponse(context) {
  if (!context.isTest) {
    console.log('Sending a 200 response to client.');
    context.finishResponse();
  }
}

/**
 * Chain promises together in a sequence
 *
 * @param calls Array of functions that return a promise
 * @param val Value to pass among chain
 * @return Promise from the end of the chain
 */
function chainPromises(calls, val) {
    if (!calls || !calls.length) {
        return Q.when(val);
    }
    return calls.reduce(Q.when, Q.when(val));
}

module.exports = {
  colors: colors,
  preResponse: preResponse,
  chainPromises: chainPromises
};
