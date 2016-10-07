'use strict'

const request = require('request'),
    rp = require('request-promise'),
    colors = ['#1c4fff', '#e84778', '#ffc229', '#1ae827', '#5389ff'];

module.exports = function (req, res, next) {
  var botPayload = {};
  botPayload.username = 'Gethuman Bot';
  botPayload.channel = req.body.channel_id;

  var textInput = req.body.text;
  if (textInput) {
    summonQuestionResponse(textInput, botPayload, res);
  } else {
    prepareUserInputPrompt(botPayload, res);
  };
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

function summonQuestionResponse(textInput, botPayload, res) {
    let filters = {
        type: 'question',
        isGuide: true
    };
    let limit = 5;
    request('https://api.gethuman.co/v3/posts/search?match='
            + encodeURIComponent(textInput)
            + '&limit='
            + limit
            + '&filterBy='
            + encodeURIComponent(JSON.stringify(filters))
    , function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var companyIDs = [];
            var guideIDs = [];
            var companyObjects = [];
            var companyTable = {};
            var guideObjects = [];
            var guideTable = {};
            console.log("Managed to hit the Posts API with success!");
            console.log("Posts returned: " + body.substring(0,400));
            var questions = JSON.parse(body);
            if (questions && questions.length) {
                for (let i = 0; i < questions.length; i++) {
                    companyIDs.push(questions[i].companyId);
                    guideIDs.push(questions[i].guideId);
                };
                request('https://api.gethuman.co/v3/companies?where='
                    + encodeURIComponent(JSON.stringify({ _id: { $in: companyIDs }}))
                    , function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        companyObjects = JSON.parse(body);
                        for (let i = 0; i < companyObjects.length; i++) {
                            companyTable[companyObjects[i]._id] = companyObjects[i]
                        };
                        request('https://api.gethuman.co/v3/guides?where='
                            + encodeURIComponent(JSON.stringify({ _id: { $in: guideIDs }}))
                            , function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                guideObjects = JSON.parse(body);
                                for (let i = 0; i < guideObjects.length; i++) {
                                    guideTable[guideObjects[i]._id] = guideObjects[i]
                                };
                                // attach Companies and Guides to Questions
                                for (var i = 0; i < questions.length; i++) {
                                    let cID = questions[i].companyId;
                                    questions[i].company = companyTable[cID];
                                    let gID = questions[i].guideId;
                                    questions[i].guide = guideTable[gID];
                                };
                                prepareQuestionsPayload(questions, botPayload, res);
                            } else if (error) {
                                prepareApiFailPayload(botPayload, res);
                                console.log(error);
                            }
                        });
                    } else if (error) {
                        prepareApiFailPayload(botPayload, res);
                        console.log(error);
                    }
                });
            } else {
                summonCompanyResponse(textInput, botPayload, res);
            };
        } else if (error) {
            prepareApiFailPayload(botPayload, res);
            console.log(error);
        }
    })
};

// first target to Promise-ify
// function summonCompanyResponse(textInput, botPayload, res) {
//     var companies = [];
//     rp('https://api.gethuman.co/v3/companies/search?limit=5&match=' + encodeURIComponent(textInput))
//     .then(function (htmlString) {
//         companies = JSON.parse(htmlString);
//         if (companies && companies.length) {
//             prepareCompaniesPayload(companies, botPayload, res);
//         } else {
//             prepareNothingFoundPayload(botPayload, res);
//         };
//     })
//     .catch(function (err) {
//         console.log(err);
//     });
// };

// non-Promise version
function summonCompanyResponse(textInput, botPayload, res) {
    request('https://api.gethuman.co/v3/companies/search?limit=5&match=' + encodeURIComponent(textInput), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var companies = JSON.parse(body);
            if (companies && companies.length) {
                prepareCompaniesPayload(companies, botPayload, res);
            } else {
                prepareNothingFoundPayload(botPayload, res);
            };
        } else if (error) {
          console.log(error);
        }
    })
};

function prepareQuestionsPayload(questions, botPayload, res) {
    botPayload.text = "Here are some issues potentially matching your input, and links for how to resolve them:";
    botPayload.icon_emoji = ':tada:';
    botPayload.attachments = [];

    for (let i = 0; i < questions.length; i++) {
        let name = questions[i].companyName || '';
        let color = colors[i];
        let urlId = questions[i].urlId || '';
        let phone = (questions[i].company) ? questions[i].company.callback.phone : '';
        let title = questions[i].title || '';
        if (title.indexOf(name) < 0) {
            title = name + ": " + title;
        };
        let emailContactMethods = questions[i].company.contactMethods.filter(function ( method ) {
            return method.type === "email";
        });
        let email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';
        let textField = formatTextField(phone, email);
        let singleAttachment = {
            "fallback": "Solution guide for " + name,
            "title": title,
            "color": color,
            "text": textField,
            "fields": [
                {
                    "value": "------------------------------------------------------",
                    "short": false
                },
                {
                    "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|Step by Step Guide>",
                    "short": true
                },
                {
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Solve for me - $20>",
                    "short": true
                }
            ]
        };
        botPayload.attachments.push(singleAttachment);
    };

    // attach buttons to receive feedback
    // (buttons not currently functional, until Bot status acheived)
    // botPayload.attachments.push({
    //     "fallback": "Are you happy with these answers?",
    //     "title": "Are you happy with these answers?",
    //     "callback_id": "questions_feedback",
    //     "color": "#ff0000",
    //     "attachment_type": "default",
    //     "actions": [
    //         {
    //             "name": "yes",
    //             "text": "Yes",
    //             "type": "button",
    //             "value": "Yes"
    //         },
    //         {
    //             "name": "no",
    //             "text": "No",
    //             "type": "button",
    //             "value": "No"
    //         }
    //     ]
    // });

    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        return res.status(200).end();
      }
    });
};

function prepareCompaniesPayload(companies, botPayload, res) {
    botPayload.text = "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:";
    botPayload.icon_emoji = ':flashlight:';
    botPayload.attachments = [];

    for (let i=0; i < companies.length; i++) {
        let name = companies[i].name || '';
        console.log("Company name found: " + name);
        let color = colors[i];
        let phone = companies[i].callback.phone || '';
        // similar to other email harvest, but not the same
        let emailContactMethods = companies[i].contactMethods.filter(function ( method ) {
            return method.type === "email";
        });
        let email = (emailContactMethods && emailContactMethods.length) ? email = emailContactMethods[0].target : '';
        let textField = formatTextField(phone, email);
        let singleAttachment = {
            "fallback": "Company info for " + name,
            "title": name,
            "color": color,
            "text": textField,
            "fields": [
                {
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Hire GetHuman to Solve - $20>",
                    "short": true
                }
            ]
        };
        botPayload.attachments.push(singleAttachment);
    };
    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        return res.status(200).end();
      }
    });
}

// string of regex's to remove HTML tags from string
// not needed if not displaying solutions text
// function stripHtml(string) {
//     return string.replace(/<\s*br\/*>/gi, "\n")
//       .replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ")
//       .replace(/<\s*\/*.+?>/ig, "\n")
//       .replace(/ {2,}/gi, " ")
//       .replace(/\n+\s*/gi, "\n\n");
// }

function prepareUserInputPrompt(botPayload, res) {
    botPayload.text = "Tell me your customer service issue.";
    botPayload.icon_emoji = ':question:';
    send(botPayload, function (error, status, body) {
    if (error) {
      return next(error);
    } else if (status !== 200) {
      return next(new Error('Incoming WebHook: ' + status + ' ' + body));
    } else {
      return res.status(200).end();
    }
    });
};

function prepareNothingFoundPayload(botPayload, res) {
    botPayload.text = "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?";
    botPayload.icon_emoji = ':question:';
    console.log("Received no results from Companies API for user input");
    send(botPayload, function (error, status, body) {
        if (error) {
          return next(error);
        } else if (status !== 200) {
          return next(new Error('Incoming WebHook: ' + status + ' ' + body));
        } else {
          return res.status(200).end();
        }
    });
};

function prepareApiFailPayload(botPayload, res) {
    botPayload.text = "The GetHuman database just borked out. Sorry, try again later!";
    botPayload.icon_emoji = ':question:';
    console.log("GetHuman API failed.");
    send(botPayload, function (error, status, body) {
        if (error) {
          return next(error);
        } else if (status !== 200) {
          return next(new Error('Incoming WebHook: ' + status + ' ' + body));
        } else {
          return res.status(200).end();
        }
    });
};

function formatTextField(phone, email) {
    let result = '';
    if (phone && email) {
        result = phone + " | " + email;
    } else if (phone) {
        result = phone;
    } else if (email) {
        result = email;
    };
    return result;
};


