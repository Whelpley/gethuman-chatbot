'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('./api/company.js'),
    postSearch = require('./api/post.js'),
    guideSearch = require('./api/guide.js'),
    preparePayload = require('./api/payloads.js');

module.exports = function (req, res, next) {
    console.log(JSON.stringify(req));

  var channelId = req.body.channel_id;
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
            return attachCompaniesAndGuides(posts)
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
        return send(channelId, payload)
            .then(function () {
                res.status(200).end();
            });
    })
    .catch(function (err) {
        console.log(err);
        send(channelId, preparePayload.error(err))
            .then(function () {
                res.status(200).end();
            });
        // res.status(200).end();
    });
  } else {
    send(channelId, preparePayload.inputPrompt())
        .then(function () {
            res.status(200).end();
        });
  };
}

// access Company and Guide objects matching each Question, return one mega-Posts object
//  !!!! WE DONT EVEN NEED THE GUIDES - ON THE CHOPPING BLOCK !!!!
// method could also be refactored
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

function send (channelId, payload) {
  var deferred = Q.defer();
  var path = process.env.INCOMING_WEBHOOK_PATH;
  var uri = 'https://hooks.slack.com/services/' + path;

  payload.channel = channelId;

  request({
    uri: uri,
    method: 'POST',
    body: JSON.stringify(payload)
  }, function (error, response, body) {
    if (error) {
      deferred.reject(error);
    }
    else {
        deferred.resolve();
    }
  });

  return deferred.promise;
}








