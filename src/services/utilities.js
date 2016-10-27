'use strict'

const Q = require('q');
const companySearch = require('./company-api-gh');
const postSearch = require('./post-api-gh');
const phoneFormatter = require('phone-formatter');

// GetHuman green palette
var colors = ['#6E9E43', '#7BAB50', '#88B85D', '#94C469', '#A1D176', '#AEDE83', '#BBEB90', '#C8F89D', '#D4FFA9', '#E1FFB6', '#EEFFC3'];

// anything you want all bots to do before processing request
function preResponse(context) {
  if (!context.isTest) {
    console.log("Sending a 200 response to client.");
    context.finishResponse();
  }
}

// find the top 5 Posts associated with a Company, attach them to the Company object
function queryPostsofCompany(company) {
  return Q.when(postSearch.findPostsofCompany(company))
    .then(function (posts) {
      // console.log("Results of Posts of Company search: " + JSON.stringify(posts).substring(0,400));
      company.posts = posts;
      return company;
    })
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
    if ((counter <= 3) && (contactInfo[key])) {
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

//  should exist in Messenger Handler
function formatContactButtonsMessenger(contactInfo) {
  var buttons = [];
  var counter = 1;
  for(var key in contactInfo) {
    if ((counter <= 3) && (contactInfo[key])) {
      var button = {};
      switch(key) {
          case 'twitter':
              button = {
                "type": "web_url",
                "url": 'https://twitter.com/' + contactInfo[key],
                "title": "Twitter"
              };
              break;
          case 'web':
              button = {
                "type": "web_url",
                "url": contactInfo[key],
                "title": "Web"
              };
              break;
          case 'chat':
              button = {
                "type": "web_url",
                "url": contactInfo[key],
                "title": "Chat"
              };
              break;
          case 'facebook':
              button = {
                "type": "web_url",
                "url": contactInfo[key],
                "title": "Facebook"
              };
              break;
          case 'phone':
              button = {
                  "type": "phone_number",
                  "payload": phoneFormatter.format(contactInfo[key], "+1NNNNNNNNNN"),
                  "title": contactInfo[key]
              }
              break;
          case 'email':
              console.log("Email detected, not creating button for it because Messenger won't let us.");
              break;
          default:
              console.log("Something went wrong in Facebook contact button formatting");
      }
      if (button.type) {
        buttons.push(button);
        counter += 1;
      };
    }
  }
  console.log("Buttons formatted from contact info: " + JSON.stringify(buttons));
  return buttons;
};

// convert an arry of strings to one string separated by commas, with each entry *bolded*
function convertArrayToBoldList(arrayOfStrings) {
  var result = '*';
  result = result + arrayOfStrings.join('*, *') + "*";
  return result;
}

module.exports = {
  preResponse: preResponse,
  queryPostsofCompany: queryPostsofCompany,
  colors: colors,
  convertArrayToBoldList: convertArrayToBoldList,
  extractContactInfo: extractContactInfo,
  formatTextFieldSlack: formatTextFieldSlack,
  formatContactButtonsMessenger: formatContactButtonsMessenger
}
