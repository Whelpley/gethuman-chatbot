'use strict'


var envName = process.env.NODE_ENV || 'dev';
var envVars = process.env;

try {
  var env = require('./env');
  envVars = Object.assign(envVars, env.base, env[envName]);
} catch(err) {
  console.log("Error in config: " + err);
}

module.exports = {
  environment: envName,
  ghApiBaseUrl: envVars.API_BASE_URL,
  facebookAccessToken: envVars.FB_PAGE_ACCESS_TOKEN,
  slackAccessToken: envVars.INCOMING_WEBHOOK_PATH
};
