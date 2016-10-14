// checklist
// ------------
// addCompaniesToPayload(payload, companies)
// nothingFound(payload)
// inputPrompt(payload)
// error(error)
// preparePostsPayload(posts)
// prepareCompaniesPayload(companies)
// extractTextFieldFromPost(post)
// extractTextFieldFromCompany(company)
// formatTextField(phone, email)

'use strict'

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var preparePayload = require('../../bot-handlers/slack-payloads.js');



