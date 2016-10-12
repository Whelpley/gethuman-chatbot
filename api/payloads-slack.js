// prepares payloads for Slack responses

'use strict'

const colors = ['#1c4fff', '#e84778', '#ffc229', '#1ae827', '#5389ff'];

module.exports = {
  posts: posts,
  companies: companies,
  nothingFound: nothingFound,
  inputPrompt: inputPrompt,
  error: error
}

// prepares payload from Posts object
function posts(posts) {
    // console.log("Starting preparation of Posts payload: " + JSON.stringify(posts).substring(0,200));
    var payload = {};
    payload.username = 'Gethuman Bot';
    // should this specifically reference the input?
    payload.text = "Here are some issues potentially matching your input, and links for how to resolve them:";
    payload.icon_emoji = ':tada:';
    payload.attachments = [];

    for (let i = 0; i < posts.length; i++) {
        let name = posts[i].companyName || '';
        let color = colors[i];
        let urlId = posts[i].urlId || '';
        let phone = (posts[i].company) ? posts[i].company.callback.phone : '';
        let title = posts[i].title || '';
        if (title.indexOf(name) < 0) {
            title = name + ": " + title;
        };
        let emailContactMethods = posts[i].company.contactMethods.filter(function ( method ) {
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
        payload.attachments.push(singleAttachment);
    };
    // console.log("Posts payload packaged to send: " + JSON.stringify(payload));
    return payload;
};

// prepares payload from Posts object
function companies(companies) {
    console.log("Starting preparation of Companies payload: " + JSON.stringify(companies).substring(0,200));
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = "We could not find any specific questions matching your input, but here is the contact information for some companies that could help you resolve your issue:";
    payload.icon_emoji = ':flashlight:';
    payload.attachments = [];

    for (let i=0; i < companies.length; i++) {
        let name = companies[i].name || '';
        let color = colors[i];
        let phone = companies[i].callback.phone || '';
        // similar to other email harvest, but not the same
        let emailContactMethods = companies[i].contactMethods.filter(function ( method ) {
            return method.type === "email";
        });
        let email = (emailContactMethods && emailContactMethods.length) ? emailContactMethods[0].target : '';
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
        payload.attachments.push(singleAttachment);
    };
    console.log("Companies payload packaged to send: " + JSON.stringify(payload));
    return payload;

}

function nothingFound() {
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = "We could not find anything matching your input to our database. Could you try rephrasing your concern, and be sure to spell the company name correctly?";
    payload.icon_emoji = ':question:';
    return payload;
};

function inputPrompt() {
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = "Tell me your customer service issue.";
    payload.icon_emoji = ':ear:';
    return payload;
};

function error(error) {
    var payload = {};
    payload.username = 'Gethuman Bot';
    payload.text = error;
    payload.icon_emoji = ':no_good:';
    return payload;
};

// helper functions

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

// string of regex's to remove HTML tags from string
// not needed if not displaying solutions text
// function stripHtml(string) {
//     return string.replace(/<\s*br\/*>/gi, "\n")
//       .replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ")
//       .replace(/<\s*\/*.+?>/ig, "\n")
//       .replace(/ {2,}/gi, " ")
//       .replace(/\n+\s*/gi, "\n\n");
// }

