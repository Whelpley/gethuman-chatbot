'use strict'

const express = require('express'),
 bodyParser = require('body-parser'),
 request = require('request'),
 app = express();

// should this just be declared in FB bot module?
const token = process.env.FB_PAGE_ACCESS_TOKEN
// is this even used?
const GH_token = process.env.GH_API_ACCESS_TOKEN

var hellobot = require('./hellobot.js'),
 dicebot = require('./dicebot.js'),
 ghSlackBot = require('./gh-slack-promises.js'),
 ghFacebookBot = require('./gh-facebook-bot.js');

var port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

// test route
app.get('/', function (req, res) { res.status(200).send('Hello world!') });

// hellobot - keep for testing
app.post('/hello', hellobot);
// dicebot - keep for testing
app.post('/roll', dicebot);
// gethuman bot for Slack
app.post('/gethuman', ghSlackBot);
// gethuman bot for FB
app.post('/webhook/', ghFacebookBot);

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token');
})

app.listen(port, function () {
  console.log('Fusion bot listening on port ' + port);
});


// // unified api endpoint
// app.post('/v3/webhook', function (req, res) {

//   // put data from the Express req object into our custom context object
//   // let's us build to a custom object rather than something Express specific
//   var platformRequestContext = { userRequest: req.body };

//   // get a BotHandler object based on the context
//   // code would have logic to look at context and return either
//   // SlackBotHandler object or the MessengerBotHandler, etc.
//   getBotHandler(platformRequestContext)
//     .then(function (botHandler) {

//       // do what is currently in payloads module
//       return botHandler.getHandlerSuccessResponse(platformRequestContext);
//     })

//     // this is an object that contains { raw: {}, data: {}, context: {} }
//     .then(function (handlerSuccessResponse) {

//       // this is the response to the original request in line 53
//       res.send(handlerSuccessResponse.raw);

//       // this is really only if need brand new request back to platform
//       // i.e. used for slack (but messenger this may be empty)
//       botHandler.sendResponseToPlatform(handlerSuccessResponse);
//     })
//     .catch(function (err) {

//       // get response object that contains the thing you want to send to
//       // the bot when an error occurs
//       var handlerErrorResponse = botHandler.getHandlerErrorResponse(err, platformRequestContext);

//       // send response to original request (line 53)
//       res.send(handlerErrorResponse.raw);

//       // this should log error and then call botHandler.sendResponseToPlatform()
//       // under the scenes
//       botHandler.sendErrorResponse(handlerErrorResponse);
//     });
// });

// var handlers = [require('./slack.handler'), require('./messenger.handler')];

// function getBotHandler(platformRequestContext) {
//   // loop through handlers and call handlers[i].isHandlerForRequest(plaformRequestContext)

//   // else if handler not found, throw error
// }