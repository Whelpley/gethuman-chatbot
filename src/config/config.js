'use strict';

let envName = process.env.NODE_ENV || 'dev';
let envVars = process.env;

try {
  var env = require('./env');
  envVars = Object.assign({}, envVars, env.base, env[envName]);
} catch(err) {
  console.log('Error in config: ' + err);
}

module.exports = {
  environment: envName,
  ghApiBaseUrl: envVars.API_BASE_URL,
  facebookAccessToken: envVars.FB_PAGE_ACCESS_TOKEN,
  slackAccessPath: envVars.INCOMING_WEBHOOK_PATH,
  facebookVerifyToken: envVars.FACEBOOK_VERIFY_TOKEN,
  slackVerifyToken: envVars.SLACK_VERIFY_TOKEN,
  slackClientId: envVars.SLACK_CLIENT_ID,
  slackClientSecret: envVars.SLACK_CLIENT_SECRET,
  firebaseApiKey: envVars.FIREBASE_API_KEY,
  firebaseProjectName: envVars.FIREBASE_PROJECT_NAME,
  firebaseSenderId: envVars.FIREBASE_SENDER_ID
};
