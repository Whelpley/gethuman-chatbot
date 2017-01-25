# GetHuman Chatbots

A Node.js interface for accessing GetHuman's customer service contacts database through chat platforms. Currently supporting Slack and Facebook Messenger.

*(Readme currently incomplete)*

## Using The Existing Bots

Without any software installation or coding, you may interact with these bots in their deployed versions:

### Slack

To install the GetHuman Bot on your own Slack Team:

* Join Slack, and either create a new Team, or have admin access to an existing team.
* Visit the installation landing page at gethuman.com [coming soon!] .
* Click on the "Add to Slack" Button, and choose the Slack channel you wish the bot to live in.
* After successful installation, invoke the slash command by typing "/gethuman", followed by the name of the company you want information for, in the channel you have installed the bot.

### Facebook Messenger

Bot currently awaiting approval from Facebook, will post instructions when ready.

## Getting Started with Your Own Bot

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

Please note that the GetHuman API is a protected resource, so the existing code will only draw down dummy data. This code is meant as a framework for utlizing the API calls of your choosing.

Also note that the Slack and Messenger bots will not work from a locally-deployed server. You must deploy to a secure server (see below) to connect to these platforms.

### Installing Locally

(Need to edit this to relevant steps - need to re-word?)

Steps to ready this code for your own use:

1. Copy the repo to your local directory

    ```
    git clone
    ```
2. Install the node dependencies

    ```
    npm install
    ```
3. Start the repo

    ```
    npm start
    ```

### Local Usage Guide

???


### Creating a New Facebook Messenger Bot

To create your own bot, follow [this guide](https://github.com/jw84/messenger-bot-tutorial) , using the steps in the "Setup the Facebook App" section, with the following changes:

1. Replace the New Page callback url with the URL of your deployed server, followed by "/messenger"
2. Match the Verify Token to the "FACEBOOK_VERIFY_TOKEN" environment variable that you have set in your code. (Note that the "env.js" file is not included with this code for security reasons; you will need to add it yourself. Keep it secret - don't show it publicly!)
3. Save the Page Access Token to the "FB_PAGE_ACCESS_TOKEN" environment variable.

### Creating a New Slack App

Please refer to Slack's documentation on:
[Creating a new app](https://api.slack.com/slack-apps) and [Creating a slash command](https://api.slack.com/slash-commands)

When you're ready, follow the process they have outlined, with the following notes:

1. When selecting Integration Settings, choose the URL of your deployed server, followed by "/slack".
2. You will need landing page to install the [Add to Slack](https://api.slack.com/docs/slack-button) button, as part of the Oauth process.
3. On the same landing page, you will need to save a new team's Incoming Webhook path to a database. Refer to "test/testweb.js" for an example of how this works. We have used Firebase to save the external data; if you choose this as well, you will need to save the appropriate environment variables (FIREBASE_API_KEY, FIREBASE_PROJECT_NAME, FIREBASE_SENDER_ID) from your own instance. (Note that the "env.js" file is not included with this code for security reasons; you will need to add it yourself. Keep it secret - don't show it publicly!)
4. *Optional*: If you wish to verify that the message is coming from slack, go to your App's settings page, click on the "Basic Information" tab, find the Verification Token and set the "SLACK_ACCESS_TOKEN" environment variable to that token. Then un-comment lines ____ in "src/bots/slack.bot.js" to enable a verification step that cancels any response that does not match the token.


## Running the tests

To run the unit tests, run from the home directory:

```
npm test
```

(Testing framework is set up, but range of tests is currently limited.)

## Want to learn more about making bots?

Here are some resources you can use as a jumping-off point:

* [A beginner's guide to chatbots](https://chatbotsmagazine.com/the-complete-beginner-s-guide-to-chatbots-8280b7b906ca#.tlcxjxon9)
* [A listing of available tools](https://chatbotsmagazine.com/the-tools-every-bot-creator-must-know-c0e9dd685094#.2dpmk29m3)
* [A dive into UX for bots](https://medium.muz.li/the-ultimate-guide-to-chatbots-why-theyre-disrupting-ux-and-best-practices-for-building-345e2150b682#.iod8agnqx)

## Built With

* [Node.js](https://www.npmjs.com/) - Development platform
* [Firebase](https://firebase.google.com/) - Real-time database

## Authors

* **Michael Whelpley** - *Developer* - [whelpley](https://github.com/whelpley)

* **Jeff Whelpley** - *Advisor/Editor* - [jeffwhelpley](https://github.com/jeffwhelpley)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Much love to [Jeff Whelpley](https://github.com/jeffwhelpley), who guided me through the creation of my first major Node project.
* Thanks to the team at [GetHuman](https://gethuman.com/) for hosting me as an intern & providing focus for my continued eduction.
* A tip of the hat to [Dev Bootcamp](https://devbootcamp.com/), for reformatting my brain, and enabling me to start a new career in software development.

## Feedback

I'm always seeking to improve. If anything is unclear in the code or this guide, or if you have any other comments, drop me an email: whelpley@gmail.com

( I'm also seeking full-time developer work in the Bay area; if you like what you see here, find me on [LinkedIn](https://www.linkedin.com/in/whelpley) )


