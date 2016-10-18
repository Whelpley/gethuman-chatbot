'use strict'

var colors = ['#1c4fff', '#e84778', '#ffc229', '#1ae827', '#5389ff'];

function getMockPosts() {

}

var posts = [
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

var companies = [
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

var blankPayload = {
  raw: {},
  data: {},
  context: {}
}

module.exports = {
  posts: posts,
  companies: companies,
  colors: colors,
  blankPayload: blankPayload
}
