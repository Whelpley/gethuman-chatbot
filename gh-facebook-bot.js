'use strict'

const request = require('request')
const phoneFormatter = require('phone-formatter');

module.exports = function (req, res, next) {
    //where all responses to text inputs are handled
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id

        // handling text input
        if (event.message && event.message.text) {
            let text = event.message.text;
            // echoes back everything sent
            // keep in development stage to confirm functionality of response
            // sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));

            // search Questions, if found returns Question cards, if not returns Company cards
            requestQuestionCards(sender, text);
        }

        // handling postback buttons
        if (event.postback) {
          // test message verify button - echoes postback payload
          let text = JSON.stringify(event.postback);
          sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);

          let payloadText = event.postback.payload;
          sendDummyCard(sender, payloadText);
          continue
        }
    }

    res.sendStatus(200)
}


function requestQuestionCards(sender, text) {
    let questions = [];
    let companyIDs = [];
    let guideIDs = [];
    let companyObjects = [];
    let companyTable = {};
    let guideObjects = [];
    let guideTable = {};

    let filters = {
        type: 'question',
        isGuide: true
    };
    let limit = 5;
    request('https://api.gethuman.co/v3/posts/search?match='
            + encodeURIComponent(text)
            + '&limit='
            + limit
            + '&filterBy='
            + encodeURIComponent(JSON.stringify(filters))
            , function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // load response object into questions array
            questions = JSON.parse(body);
            if (questions && questions.length) {
                // let responseText = "We found " + questions.length + " relevant questions to your input.";
                // sendTextMessage(sender, responseText);
                // console.log("All questions returned from API: " + questions);
                for (let i = 0; i < questions.length; i++) {
                    companyIDs.push(questions[i].companyId);
                    guideIDs.push(questions[i].guideId);
                };
                // console.log("Company ID's: " + companyIDs);
                // console.log("Guide ID's: " + guideIDs);
                // make hash table of companyID: company Objects
                request('https://api.gethuman.co/v3/companies?where='
                    + encodeURIComponent(JSON.stringify({ _id: { $in: companyIDs }}))
                    , function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        companyObjects = JSON.parse(body);
                        // responseText = "We found " + companyObjects.length + " companies matching your questions.";
                        // sendTextMessage(sender, responseText);
                        //make the hash table
                        for (let i = 0; i < companyObjects.length; i++) {
                            companyTable[companyObjects[i]._id] = companyObjects[i]
                        };
                        // console.log("All company Objects returned from API: " + JSON.stringify(companyTable));

                        // TIME FOR CALLBACK HELL! Nesting requests!
                        // make hash table of guideID: guide Objects
                        request('https://api.gethuman.co/v3/guides?where='
                            + encodeURIComponent(JSON.stringify({ _id: { $in: guideIDs }}))
                            , function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                guideObjects = JSON.parse(body);
                                // responseText = "We found " + guideObjects.length + " guides matching your questions.";
                                // sendTextMessage(sender, responseText);
                                //make the hash table
                                for (let i = 0; i < guideObjects.length; i++) {
                                    guideTable[guideObjects[i]._id] = guideObjects[i]
                                };
                                // console.log("All guide Objects returned from API: " + JSON.stringify(guideTable));

                                // MORE CALLBACK HELL
                                // attach Companies and Guides to Questions
                                for (var i = 0; i < questions.length; i++) {
                                    let cID = questions[i].companyId;
                                    questions[i].company = companyTable[cID];
                                    // console.log("Company object attached to Question # "
                                    //     + i
                                    //     + ": "
                                    //     + JSON.stringify(questions[i].company));
                                    let gID = questions[i].guideId;
                                    questions[i].guide = guideTable[gID];
                                    // console.log("Guide object attached to Question # "
                                    // + i
                                    // + ": "
                                    // + JSON.stringify(questions[i].guide));
                                };
                                // Make cards out of massive data hash
                                // (room for optimization later! too much data being shuffled around!)
                                sendAllQuestionCards(sender, questions);

                            } else if (error) {
                            console.log(error);
                          }
                        });
                    } else if (error) {
                    console.log(error);
                  }
                });

            } else {
                let responseText = "We could not find any matching questions to your input, displaying relevant companies instead:";
                sendTextMessage(sender, responseText);
                // need to check error handling on following method:
                requestCompanyCards(sender, text);
            };
        } else if (error) {
            console.log(error);
        }
    })
};

// needs:
    // refactoring
    // variable scope checking
    // error handling
function requestCompanyCards(sender, text) {
    let companies = [];

    request('https://api.gethuman.co/v3/companies/search?limit=5&match=' + encodeURIComponent(text), function (error, response, body) {
        if (!error && response.statusCode == 200) {
        let parsedBody = JSON.parse(body);
        // console.log("Full API response: " + parsedBody);
        // iterate over API response, construct company object
        if (parsedBody && parsedBody.length) {
            for (let i=0; i < parsedBody.length; i++) {
                let newName = parsedBody[i].name || '';
                let newPhone = parsedBody[i].callback.phone || '';
                let newEmail = '';
                // filter GH array to find contactInfo
                let emailContactMethods = parsedBody[i].contactMethods.filter(function ( method ) {
                    return method.type === "email";
                });
                if (emailContactMethods && emailContactMethods.length) {
                    // console.log("Email Object found: " + JSON.stringify(emailContactMethods));
                    newEmail = emailContactMethods[0].target;
                };
                // console.log("Harvested an email: " + newEmail);
                let newCompany = new Company(newName, newPhone, newEmail);
                // push object into Companies array
                // console.log("Company # " + i + ": " + newName + ": " + newCompany);
                companies.push(newCompany);
            };
            // console.log("Formatted companies array: " + companies);
            sendAllCompanyCards(sender, companies);
        } else {
            let responseText = "We could not find any companies matching your input. Could you please tell me your issue again, and be sure to spell the company name correctly?";
            sendTextMessage(sender, responseText);
        };
      } else if (error) {
        console.log(error);
      }
    })
};

function sendDummyCard(sender, payloadText) {
    let elements = [];
    let singleElement = {
        "title": "Dummy Card!",
        // what to display if no email or phone available?
        "subtitle": "This will show a solution for " + payloadText,
        // "buttons": [{
        //     "type": "postback",
        //     "title": "Guides",
        //     "payload": "Payload for second element in a generic bubble",
        // }, {
        //     "type": "web_url",
        //     "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
        //     "title": "Solve - $20"
        // }],
    };
    elements.push(singleElement);
    sendCards(sender, elements);
};

function sendAllQuestionCards(sender, questions) {
    console.log("Question cards will be sent at this step.");
    let elements = [];
    // iterate over Questions, make single cards, push into elements
    for (let i = 0; i < questions.length; i++) {
        let companyName = questions[i].companyName || '';
        let urlId = questions[i].urlId || '';
        // console.log("Company info for " + companyName + ": " + JSON.stringify(questions[i].company));
        let phone = (questions[i].company) ? questions[i].company.callback.phone : '';
        // console.log("Phone info for " + companyName + ": " + phone);
        //format phone# for international format
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        let title = questions[i].title || '';
        // check if company name is in title already, add to front if not
        if (title.indexOf(companyName) < 0) {
            title = companyName + ": " + title;
        };
        // truncate title
        title = title.substring(0,79);
        // real solutions:
        let solution = questions[i].guide.steps[0].details || 'No solution found. Despair and wail!';
        console.log("Solution for Question # " + i + ": " + solution);
        solution = solution.substring(0,79);

        let singleElement = {
            "title": title,
            "subtitle": solution,
            "buttons": [{
                "type": "web_url",
                "url": "https://answers.gethuman.co/_" + encodeURIComponent(urlId) ,
                "title": "More Info"
            }, {
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(companyName) ,
                "title": "Solve - $20"
            }],
        };
        // if there is a valid phone # (needs stricter checks), add Call button
        if (phoneIntl) {
            singleElement.buttons.unshift({
                "type": "phone_number",
                "title": "Call " + companyName,
                "payload": phoneIntl
            })
        };
        elements.push(singleElement);
    };
    sendCards(sender, elements);
};

function sendAllCompanyCards(sender, companies) {
    console.log("Company cards will be sent at this step.");
    let elements = [];
    // iterate over companies, make single cards, push into elements
    for (let i = 0; i < companies.length; i++) {
        let name = companies[i].name || '';
        let email = companies[i].email || 'No email found';
        let phone = companies[i].phone || '';
        //format phone# for international format
        let phoneIntl = (phone) ? phoneFormatter.format(phone, "+1NNNNNNNNNN") : '';
        // dummy image
        // has to be a valid URL - not local storage
        // let image = "http://findicons.com/files/icons/2198/dark_glass/128/modem2.png"
        let singleElement = {
            "title": name,
            "subtitle": email,
            // "image_url": image,
            "buttons": [
            // This would trigger a new card, but it's not needed since the Guides are already checked for initially.
            // {
            //     "type": "postback",
            //     "title": "Guides",
            //     "payload": name,
            // },
            {
                "type": "web_url",
                "url": "https://gethuman.com?company=" + encodeURIComponent(name) ,
                "title": "Solve - $20"
            }],
        };
        // if there is a valid phone # (needs stricter checks), add Call button
        if (phoneIntl) {
            singleElement.subtitle = phone + ",\n" + email,
            singleElement.buttons.unshift({
                "type": "phone_number",
                "title": "Call " + name,
                "payload": phoneIntl
            })
        };
        elements.push(singleElement);
    };
    // console.log("All of the elements of the cards: " + elements);
    sendCards(sender, elements);
}

//sends a basic text message
function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
};

//sends styled cards with buttons
function sendCards(sender, elements) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            },
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}

// should this function declaration exist elsewhere?
// Should we just use the un-compressed Company object returned from the API? (answer: YES)
function Company(name, phone, email) {
  this.name = name;
  this.phone = phone;
  this.email = email
};
