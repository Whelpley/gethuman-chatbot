const Q = require('q');
const phoneFormatter = require('phone-formatter');

// GetHuman green palette
var colors = [
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
    console.log("Sending a 200 response to client.");
    context.finishResponse();
  }
}

// takes Company object, puts associated info into an result object
function extractContactInfo(commonResponse) {
  var contactInfo = {
    phone: '',
    email: '',
    twitter: '',
    web: '',
    chat: '',
    facebook: ''
  };
  var company = commonResponse.data;
  contactInfo.phone = company.callback.phone || '';

  let emailContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "email";
    });
  contactInfo.email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';

  let twitterContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "twitter";
    });
  contactInfo.twitter = (twitterContactMethods && twitterContactMethods.length) ? twitterContactMethods[0].target : '';

  let webContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "web";
    });
  contactInfo.web = (webContactMethods && webContactMethods.length) ? webContactMethods[0].target : '';

  let chatContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "chat";
    });
  contactInfo.chat = (chatContactMethods && chatContactMethods.length) ? chatContactMethods[0].target : '';

  let facebookContactMethods = company.contactMethods.filter(function (method) {
        return method.type === "facebook";
    });
  contactInfo.facebook = (facebookContactMethods && facebookContactMethods.length) ? facebookContactMethods[0].target : '';

  console.log("Extracted contact info from company: " + JSON.stringify(contactInfo));
  return contactInfo;
}


//  should exist in Slack Handler
function formatTextFieldSlack(contactInfo) {
  var result = '';
  var counter = 1;
  for(var key in contactInfo) {
    if (contactInfo.hasOwnProperty(key) && (counter <= 3) && (contactInfo[key])) {
      switch(key) {
          case 'twitter':
              result = result + '<https://twitter.com/' + contactInfo[key] +'|Twitter> | ';
              break;
          case 'web':
              result = result + '<' + contactInfo[key] +'|Web> | ';
              break;
          case 'chat':
              result = result + '<' + contactInfo[key] +'|Chat> | ';
              break;
          case 'facebook':
              result = result + '<' + contactInfo[key] +'|Facebook> | ';
              break;
          default:
              result = result + contactInfo[key] + ' | ';
      }
      counter += 1;
    }
  }
  if (result) {
    result = result.slice(0,-3);
  }
  console.log("Formatted string from contact info: " + result);
  return result;
};


// convert an array of strings to one string separated by commas, with each entry *bolded*
function convertArrayToBoldList(arrayOfStrings) {
  var result = '*';
  result = result + arrayOfStrings.join('*, *') + "*";
  return result;
}

/**
 * Chain promises together in a sequence
 *
 * @param calls Array of functions that return a promise
 * @param val Value to pass among chain
 * @returns Promise from the end of the chain
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
  convertArrayToBoldList: convertArrayToBoldList,
  extractContactInfo: extractContactInfo,
  formatTextFieldSlack: formatTextFieldSlack,
  formatContactButtonsMessenger: formatContactButtonsMessenger,
  chainPromises: chainPromises
};
