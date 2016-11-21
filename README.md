# GetHuman Chatbots

A Node.js interface for accessing GetHuman's customer service contacts database through chat platforms. Currently supporting Slack and Facebook Messenger.

*(Readme currently incomplete)*

## Using The Existing Bots

Without any software installation or coding, you may interact with these bots in their deployed versions:

### Slack

To install the GetHuman Bot on your own Slack Team:

* Join Slack, and either create a new Team, or have admin access to an existing team.
* Visit the installation landing page at _______ .
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
3.

### Creating a New Slack Bot

Please refer to [Slack's documentation](https://api.slack.com/slash-commands) for details on creating your own custom command. When you're ready, visit the [Custom Integrations page](https://api.slack.com/custom-integrations) and follow the process, with the following notes:

1. When selecting Integration Settings, choose the URL of your deployed server, followed by "/slack"
2. Create your Incoming Webhook to receive messages from the bot; in the setting page for that webhook, find the Webhook URL field. Set this to your
3. Set your environment variables in a secure location. (How???) . Do not upload unsecured tokens to a public code repository.


## Running the tests

To run the unit tests, run from the home directory:

```
npm test
```

(Testing framework is set up, but tests are currently incomplete.)

## Built With

* [Node.js](https://www.npmjs.com/) - The web framework used
* [Firebase](https://firebase.google.com/) - Real-time database

## Authors

* **Michael Whelpley** - *Developer* - [whelpley](https://github.com/whelpley)

* **Jeff Whelpley** - *Advisor/Editor* - [jeffwhelpley](https://github.com/jeffwhelpley)

## License

(need to choose License)

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Thanks to the team at GetHuman

## Feedback

If anything is unclear in this Readme & the code, or if you have any other questions, drop me an email: whelpley@gmail.com

## Want to learn more about making bots?

Here are some resources you can use as a jumping-off point:

* Hat tip to anyone who's code was used
* Inspiration
* etc
* Thanks to the team at GetHuman
