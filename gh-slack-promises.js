'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('./api/company.js'),
    postSearch = require('./api/post.js'),
    guideSearch = require('./api/guide.js'),
    preparePayload = require('./api/payloads.js');

module.exports = function (req, res, next) {
  var textInput = req.body.text;
  if (textInput) {
    Q.all([
        postSearch.findByText(textInput),
        companySearch.findByText(textInput)
    ])
    .then(function (postAndCompanySearchResults) {
        var posts = postAndCompanySearchResults[0];
        var companies = postAndCompanySearchResults[1];

        if (posts && posts.length) {
            // ? is this right order for nesting Promises ?
            attachCompaniesAndGuides(posts)
            .then(function (posts){
                return preparePayload.posts(posts);
            });
        }
        else if (companies && companies.length) {
            return preparePayload.companies(companies);
        }
        else {
            return preparePayload.nothingFound();
        }
    })
    .then(function (payload) {
        res.send(payload);
    })
    .catch(function err) {
        // still need a payload formatter for errors
        res.send(getFormattedError(err));
    });
  } else {
    res.send(preparePayload.inputPrompt());
  };
}

// access Company and Guide objects matching each Question, return one mega-Posts object
function attachCompaniesAndGuides(posts) {
    var companyIDs = [];
    var guideIDs = [];
    for (let i = 0; i < posts.length; i++) {
        companyIDs.push(posts[i].companyId);
        guideIDs.push(posts[i].guideId);
    };

    return Q.all([
            companySearch.findByIds(companyIDs),
            guideSearch.findByIds(guideIDs)
        ])
    .then(function (companiesAndGuides) {
        var companies = companiesAndGuides[0];
        var guides = companiesAndGuides[1];
        // refactor this
        var companyTable = {};
        var guideTable = {};
        for (let i = 0; i < companies.length; i++) {
            companyTable[companies[i]._id] = companies[i];
            guideTable[guides[i]._id] = guides[i];
        };
        for (let i = 0; i < posts.length; i++) {
            let cID = posts[i].companyId;
            posts[i].company = companyTable[cID];
            let gID = posts[i].guideId;
            posts[i].guide = guideTable[gID];
        };
        return posts;
    })
}

// old send - why can't I compress in the callback?
function send (payload, callback) {
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
  }, function (error, response, body) {
    if (error) {
      return callback(error);
    }
    callback(null, response.statusCode, body);
  });
}


// Save for now - how Send is invoked
    // send(botPayload, function (error, status, body) {
    //   if (error) {
    //     return next(error);
    //   } else if (status !== 200) {
    //     return next(new Error('Incoming WebHook: ' + status + ' ' + body));
    //   } else {
    //     return res.status(200).end();
    //   }
    // });





