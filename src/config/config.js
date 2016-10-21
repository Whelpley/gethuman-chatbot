
var envName = process.env.NODE_ENV || 'dev';
var envVars = process.env;

try {
  env = require('./env');
  envVars = Object.assign(envVars, env.base, env[envName]);
} catch() {}

module.exports = {
  environment: envName,
  ghApiBaseUrl: envVars.API_BASE_URL,
  facebookAccessToken: envVars.FB_PAGE_ACCESS_TOKEN,

};
