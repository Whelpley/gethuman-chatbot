'use strict'

const request = require('request');
const phoneFormatter = require('phone-formatter');

const colors = ['#1c4fff', '#e84778', '#ffc229', '#1ae827', '#5389ff'];

module.exports = function (req, res, next) {
  var botPayload = {};
  botPayload.username = 'Gethuman Bot';
  botPayload.channel = req.body.channel_id;

  //handling text input
  var textInput = (req.body.text) ? req.body.text : '';
  if (textInput) {
      // passing in 'res' for debugging
      summonQuestionResponse(textInput, botPayload, res);
  } else {
      botPayload.text = "Tell me your customer service issue.";
      botPayload.icon_emoji = ':question:';
      // send payload
      // console.log("About to send the payload. Godspeed!");
      send(botPayload, function (error, status, body) {
        if (error) {
          return next(error);
        } else if (status !== 200) {
          // inform user that our Incoming WebHook failed
          // console.log("Oh the humanity! Payload has crashed and burned.");
          // console.log("Let's have a look at the payload: " + JSON.stringify(botPayload));
          return next(new Error('Incoming WebHook: ' + status + ' ' + body));
        } else {
          // console.log("Payload sent on for much win.");
          return res.status(200).end();
      }
      });
  };
}

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
    var questions = [];
    var companyIDs = [];
    var guideIDs = [];
    var companyObjects = [];
    var companyTable = {};
    var guideObjects = [];
    var guideTable = {};

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
            questions = JSON.parse(body);
            if (questions && questions.length) {
                for (let i = 0; i < questions.length; i++) {
                    companyIDs.push(questions[i].companyId);
                    guideIDs.push(questions[i].guideId);
                };
                // console.log("Company ID's: " + companyIDs);
                // console.log("Guide ID's: " + guideIDs);
                request('https://api.gethuman.co/v3/companies?where='
                    + encodeURIComponent(JSON.stringify({ _id: { $in: companyIDs }}))
                    , function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        companyObjects = JSON.parse(body);
                        for (let i = 0; i < companyObjects.length; i++) {
                            companyTable[companyObjects[i]._id] = companyObjects[i]
                        };
                        // console.log("All company Objects returned from API: " + JSON.stringify(companyTable));
                        request('https://api.gethuman.co/v3/guides?where='
                            + encodeURIComponent(JSON.stringify({ _id: { $in: guideIDs }}))
                            , function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                guideObjects = JSON.parse(body);
                                for (let i = 0; i < guideObjects.length; i++) {
                                    guideTable[guideObjects[i]._id] = guideObjects[i]
                                };
                                // console.log("All guide Objects returned from API: " + JSON.stringify(guideTable));
                                // attach Companies and Guides to Questions
                                for (var i = 0; i < questions.length; i++) {
                                    let cID = questions[i].companyId;
                                    questions[i].company = companyTable[cID];
                                    let gID = questions[i].guideId;
                                    questions[i].guide = guideTable[gID];
                                };
                                prepareQuestionsPayload(questions, botPayload, res);
                            } else if (error) {
                            console.log(error);
                          }
                        });
                    } else if (error) {
                    console.log(error);
                  }
                });
            } else {
                // console.log("Received no results from Questions API for input: " + textInput);
                summonCompanyResponse(textInput, botPayload, res);
            };
        } else if (error) {
            console.log(error);
        }
    })
};

function summonCompanyResponse(textInput, botPayload, res) {
    var companies = [];

    request('https://api.gethuman.co/v3/companies/search?limit=5&match=' + encodeURIComponent(textInput), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            companies = JSON.parse(body);
            // console.log("Full API response: " + body);
            if (companies && companies.length) {
                prepareCompaniesPayload(companies, botPayload, res);
            } else {
                // send back a plain text response, prompt for usable input
                botPayload.text = "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?";
                botPayload.icon_emoji = ':stuck_out_tongue:';
                console.log("Received no results from Companies API for input: " + textInput);
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
        } else if (error) {
          console.log(error);
        }
    })
};

function prepareQuestionsPayload(questions, botPayload, res) {
    botPayload.text = "Here are some issues potentially matching your input, and how to resolve them. Check them out!";
    botPayload.icon_emoji = ':tada:';
    botPayload.attachments = [];

    for (let i = 0; i < questions.length; i++) {
        // console.log("Question # " + i + ": " + JSON.stringify(questions[i]));
        let name = questions[i].companyName || '';
        console.log("Company name found: " + name);
        let color = colors[i];
        let urlId = questions[i].urlId || '';
        let phone = (questions[i].company) ? questions[i].company.callback.phone : '';
        //format phone# for international format
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let title = questions[i].title || '';
        // check if company name is in title already, add to front if not
        if (title.indexOf(name) < 0) {
            title = name + ": " + title;
        };
        // also has potential for funky-not-fresh formatting wrt HTML tags - how to strip?
        if (questions[i].guide.steps) {
            console.log("Solutions for Question #" + i + ": " + JSON.stringify(questions[i].guide.steps));
        } else {
            console.log("No solutions found for Question #" + i);
        };
        let solution = questions[i].guide.steps[0].details || 'No solution found for this issue.';
        // experimental solution to strip Html
        solution = stripHtml(solution);
        let singleAttachment = {
            "fallback": "Solution guide for " + name,
            "title": title,
            "color": color,
            // redundant link to one in the Fields - add this if removing the Field
            // "title_link": "https://answers.gethuman.co/_" + encodeURIComponent(urlId),
            "text": solution,
            "fields": [
                {
                    // "title": "*****************************************",
                    "value": "------------------------------------------------------",
                    "short": false
                },
                {
                    // "title": "More info",
                    "value": "<https://answers.gethuman.co/_" + encodeURIComponent(urlId) + "|See full guide>",
                    "short": true
                },
                {
                    // "title": "Let us do it for you",
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Hire GetHuman to Solve - $20>",
                    "short": true
                }
            ]
        };
        if (phoneIntl) {
            singleAttachment.fields.push({
                // "title": "Talk with " + name,
                "value": "<tel:" + phoneIntl + "|Call " + name + ">",
                "short": true
            })
        };
        botPayload.attachments.push(singleAttachment);
    };
    // attach buttons to receive feedback
    // not currently functional, until Bot status acheived
    botPayload.attachments.push({
        "fallback": "Are you happy with these answers?",
        "title": "Are you happy with these answers?",
        "callback_id": "questions_feedback",
        "color": "#ff0000",
        "attachment_type": "default",
        "actions": [
            {
                "name": "yes",
                "text": "Yes",
                "type": "button",
                "value": "Yes"
            },
            {
                "name": "no",
                "text": "No",
                "type": "button",
                "value": "No"
            }
        ]
    });

    console.log("About to send the Questions payload. Godspeed!");
    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        // inform user that our Incoming WebHook failed
        console.log("Oh the humanity! Questions payload has crashed and burned.");
        console.log("Let's have a look at the payload: " + JSON.stringify(botPayload));
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        console.log("Questions payload sent on for much win.");
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
        // not needed! Slack will auto-detect phone number!
        // let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let email = '';
        // filter GH array to find contactInfo
        let emailContactMethods = companies[i].contactMethods.filter(function ( method ) {
            return method.type === "email";
        });
        if (emailContactMethods && emailContactMethods.length) {
            email = emailContactMethods[0].target;
        };
        let singleAttachment = {
            "fallback": "Company info for " + name,
            "title": name,
            "color": color,
            "text": email + "\n" + phone,
            "fields": [
                {
                    // "title": "Solve - $20",
                    "value": "<https://gethuman.com?company=" + encodeURIComponent(name) + "|Hire GetHuman to Solve - $20>",
                    "short": true
                }
            ]
        };
        // No need for this - Slack auto-interprets phone!
        // if (phoneIntl) {
        //     singleAttachment.fields.unshift({
        //         "title": "Want to talk to " + name + " ?",
        //         "value": "<tel:" + phoneIntl + "|Call them now>",
        //         "short": true
        //     })
        // };
        if (email) {
            singleAttachment.fields.unshift({
                    // "title": "Email " + name,
                    "value": "<mailto:" + email + "|Email " + name + ">",
                    "short": true
            })
        };
        botPayload.attachments.push(singleAttachment);
    };
    // payload ready, send it on!
    console.log("About to send the Questions payload. Godspeed!");
    send(botPayload, function (error, status, body) {
      if (error) {
        return next(error);
      } else if (status !== 200) {
        // inform user that our Incoming WebHook failed
        console.log("Oh the humanity! Companies payload has crashed and burned.");
        console.log("Let's have a look at the payload: " + JSON.stringify(botPayload));
        return next(new Error('Incoming WebHook: ' + status + ' ' + body));
      } else {
        console.log("Companies payload sent on for much win.");
        return res.status(200).end();
      }
    });
}

// inserts new lines to a string
// for the text fields of attachments, so they collapse earlier
// drawback - will cut off string at arbitrary point, when expanded will still be cut
// also does not seem to work consistently!
// function insertLineBreaks(string, cutoff) {
//   if (string.length > cutoff) {
//     let breaks = "\n\n\n\n\n";
//     string = string.substring(0,cutoff) + breaks + string.substring(cutoff);
//   };
//   return string;
// }

// WARNING - from Stack Overflow
// string of regex's to remove tags
function stripHtml(string) {
    return string.replace(/<\s*br\/*>/gi, "\n")
      .replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ")
      .replace(/<\s*\/*.+?>/ig, "\n")
      .replace(/ {2,}/gi, " ")
      .replace(/\n+\s*/gi, "\n\n");
}