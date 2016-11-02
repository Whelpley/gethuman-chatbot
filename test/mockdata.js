'use strict'

// need to renew this

function getPosts() {
  return [
    {
      companyName: "First Company",
      urlId: 'AAAA',
      title: "This is the first Post",
      company: {
        contactMethods: [
          {
            "type":"phone",
            "target":"866-111-1111"
          },
          {
            "type":"email",
            "target":"first@first.com"
          }
        ],
        callback: {
          phone: "866-111-1111"
        }
      },
    },
    {
      companyName: "Second Company",
      urlId: 'BBBB',
      title: "This is the second Post",
      company: {
        contactMethods: [
          {
            "type":"phone",
            "target":"866-222-2222"
          }
        ],
        callback: {
          phone: "866-222-2222"
        }
      },
    }
  ];
}

function getCompanies() {
  return [
    {
      name: "First Company",
      contactMethods: [
        {
          "type":"phone",
          "target":"866-111-1111"
        },
        {
          "type":"email",
          "target":"first@first.com"
        }
      ],
      callback: {
        phone: "866-111-1111"
      }
    },
    {
      name: "Second Company",
      contactMethods: [
        {
          "type":"phone",
          "target":"866-222-2222"
        }
      ],
      callback: {
        phone: "866-222-2222"
      }
    },
  ];
}

function getBlankPayload() {
  return {
    raw: {},
    data: {},
    context: {}
  }
}

module.exports = {
  getPosts: getPosts,
  getCompanies: getCompanies,
  getColors: getColors,
  getBlankPayload: getBlankPayload
}
