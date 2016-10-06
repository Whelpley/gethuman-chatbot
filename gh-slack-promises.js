'use strict'

const request = require('request'),
    Q = require('q'),
    companySearch = require('./api/company.js'),
    postSearch = require('./api/post.js'),
    guideSearch = require('./api/guide.js'),
    preparePayload = require('./api/payloads.js');

module.exports = function (req, res, next) {
  var channelId = req.body.channel_id;
  var textInput = req.body.text;
  if (textInput) {
    Q.all([
        postSearch.findByText(textInput),
        companySearch.findByText(textInput)
    ])
    // this step should return a payload for sending
    .then(function (postAndCompanySearchResults) {
        var posts = postAndCompanySearchResults[0];
        var companies = postAndCompanySearchResults[1];
        console.log("Posts returned: " + "\n" + JSON.stringify(posts).substring(0,300));
        console.log("Companies returned: " + "\n" + JSON.stringify(companies).substring(0,300));
// not returning any posts, even when it should ...
        if (posts && posts.length) {
            console.log("Yes we found some Posts!");
            return attachCompaniesAndGuides(posts)
                .then(function (posts){
                    return preparePayload.posts(posts);
                });
        }
        else if (companies && companies.length) {
            console.log("At least we found some companies!");
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
        res.status(200).end();
    });
  } else {
    send(channelId, preparePayload.inputPrompt())
            .then(function () {
                res.status(200).end();
            });
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

// does the return belong here?
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


// new send
// function send (payload) {
//   var path = process.env.INCOMING_WEBHOOK_PATH;
//   var uri = 'https://hooks.slack.com/services/' + path;

//   request({
//     uri: uri,
//     method: 'POST',
//     body: JSON.stringify(payload)
//   }, function (error, response, body) {
//     if (error) {
//       return cb(error);
//     }
//     cb(null, response.statusCode, body);
//   });
// }

// function cb (error, status, body) {
//     if (error) {
//         return next(error);
//     } else if (status !== 200) {
//         return next(new Error('Incoming WebHook: ' + status + ' ' + body));
//     } else {
//         return res.status(200).end();
//     }
// }






