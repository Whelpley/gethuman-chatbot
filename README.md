# GetHuman Chatbots

A Node.js interface for accessing GetHuman's customer service contacts database through chat platforms. Currently supporting Slack and Facebook Messenger.

*(Readme currently incomplete)*

## Using The Existing Bots

Without any software installation or coding, you may interact with these bots in their deployed versions:

### Slack

To install the GetHuman Bot on your own Slack Team:

* Visit the installation landing page at _______ .
* Click on the "Add to Slack" Button, and choose the Slack channel you wish the bot to live in.
* After successful installation, invoke the slash command by typing "/gethuman", followed by the name of the company you want information for.

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

### Local Usage

???

### Deployment

The code must first be deployed to a local server in order to interact with the platforms.

1. Get a server running at provider of your choice
2. Change the Webhooks in ____ to _____
3. Change the following URL's in code
4. Deploy code
4. ???


### Creating a New Facebook Messenger Bot

To create your own bot, follow [this guide](https://github.com/jw84/messenger-bot-tutorial) , using the steps in the "Setup the Facebook App" section, replacing the New Page callback url with the URL of your deployed server, followed by _____

### Creating a New Slack Bot

Follow [Slack's documentation](https://api.slack.com/slash-commands) to create your own custom command, with the following notes:

1. /Command name match - in Slack, in Code
2. Webhook URL match
3. ???


## Running the tests

(Testing framework is set up, but tests are currently incomplete.)

To run the unit tests, run from the home directory:

```
npm test
```

## Built With

* [Node.js](https://www.npmjs.com/) - The web framework used
* [Firebase](https://firebase.google.com/) - Real-time database

## Authors

* **Michael Whelpley** - *Initial work* - [whelpley](https://github.com/whelpley)

* **Jeff Whelpley** - *Advisor/Editor* - [jeffwhelpley](https://github.com/jeffwhelpley)

## License

(need to choose License)

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments


* Hat tip to anyone who's code was used
* Inspiration
* etc
* Thanks to the team at GetHuman
