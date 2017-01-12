/*
CHECKLIST
_ Mock Companies API return (C&P from actual results)
_ Mock Posts API return (C&P from actual results)

*/

'use strict'

// ex structure
function getArrayOfStrings() {
  return ['check', 'it', 'out'];
}

// returns a generic response object
// always the same, no matter what the input is
function getGenericResponse(context) {
  return {
    "userInput":"verizon",
    "data": {
      "name":"Verizon",
      "contactMethods": {
        "phone":"888-553-2555",
        "email":"",
        "twitter":"@VerizonSupport",
        "web":"http://www22.verizon.com/content/contactus/",
        "chat":"http://www22.verizon.com/content/contactus/",
        "facebook":""
      },
      "posts": [
        {
          "title":"How do I switch number to new phone?",
          "urlId":"A4u"
        },
        {
          "title":"How do I file an insurance claim?",
          "urlId":"7uV"
        },
        {
          "title":"How do I replace my phone?",
          "urlId":"7e1"
        },
        {
          "title":"I want to download backup assistant for Verizon",
          "urlId":"690"
        },
        {
          "title":"How do I start with Verizon Prepaid?",
          "urlId":"Li_"
        }
      ],
      "otherCompanies":[
        "Verizon Business",
        "Verizon DSL",
        "Verizon Smart Rewards",
        "Verizon Wireless Prepay",
        "Verizon Web Support",
        "Verizon Wireless Financial",
        "Verizon Billing",
        "Verizon Repair",
        "Verizon Wireless",
        "Verizon FiOS",
        "Verizon Land Line",
        "Verizon Center for Customers with Disabilities"
      ]
    },
    "type":"standard",
    "context": context
  }
}

function getQueryResultData() {
  return {
    contactMethods: [
      {
        type: 'phone',
        target: '666-666-6666'
      },
      {
        type: 'email',
        target: 'guy@internet.com'
      }
    ]
  }
}

function getJunkObject() {
  return {
    blah: 'this does nothing'
  }
}

function getNormalizedRequestIgnore() {
  return {
    reqType: 'ignore',
    userInput: 'blah',
    context: {}
  };
}

module.exports = {
  getArrayOfStrings: getArrayOfStrings,
  getNormalizedRequestIgnore: getNormalizedRequestIgnore,
  getGenericResponse: getGenericResponse,
  getQueryResultData: getQueryResultData,
  getJunkObject: getJunkObject
}
