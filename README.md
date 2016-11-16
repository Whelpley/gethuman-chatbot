# GetHuman Chatbots

A Node.js interface for accessing GetHuman's customer service contacts database through chat platforms. Currently supporting Slack and Facebook Messenger.

*(Readme currently incomplete)*

## Using The Existing Bots

Without any software installation or coding, you may interact with these bots in their deployed versions:

### Slack

To install the GetHuman Bot on your own Slack Team:

* Visit the installation landing page at _______ .
* Click on the "Add to Slack" Button, and choose the Slack channel you wish.
* After successful installation, invoke the slash command by typing "/gethuman", followed by the name of the company you want information for.

### Facebook Messenger

Bot currently awaiting approval from Facebook, will post instructions when ready.

## Getting Started with Your Own Bot

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

Please note that the GetHuman API is a protected resource, so the existing code will only draw down dummy data. This code is meant as a framework for utlizing the API calls of your choosing.


### Installing

(Need to edit this to relevant steps - need to re-word?)

Steps to ready this code for your own use:

1. Install the Heroku toolbelt (optional - different section) from here https://toolbelt.heroku.com to launch, stop and monitor instances. Sign up for free at https://www.heroku.com if you don't have an account yet.

2. Install Node from here https://nodejs.org, this will be the server environment. Then open up Terminal or Command Line Prompt and make sure you've got the very most recent version of npm by installing it again:

    ```
    sudo npm install npm -g
    ```

3. Create a new folder somewhere and let's create a new Node project. Hit Enter to accept the defaults.

    ```
    npm init
    ```

4. Install the additional Node dependencies. Express is for the server, request is for sending out messages and body-parser is to process messages. Q is for Promises, Firebase is for the database, Phone-formatter will do what it promises.

    ```
    npm install express request body-parser q firebase phone-formatter --save
    ```

5. Copy these files: ________. (Just copy the whole repo?)

6. Make a file called Procfile and copy this. This is so Heroku can know what file to run.

    ```
    web: node index.js
    ```

7. Commit all the code with Git then create a new Heroku instance and push the code to the cloud.

    ```
    git init
    git add .
    git commit --message 'hello world'
    heroku create
    git push heroku master
    ```
End with an example of getting some data out of the system or using it for a little demo

### Creating a New Facebook Messenger Bot

Follow [this guide](https://github.com/jw84/messenger-bot-tutorial) to create your own bot.

(Are there any other missing steps?)

1. Create or configure a Facebook App and Page here https://developers.facebook.com/apps/

    ![Alt text](/demo/shot1.jpg)

2. In the app go to Messenger tab, then click Setup Webhook. Here you will put in the URL of your Heroku server (followed by the string _____ ) and a token (default: "cmon_verify_me"). Make sure to check all the subscription fields.

    ![Alt text](/demo/shot3.jpg)

3. Get a Page Access Token and save this somewhere.

    ![Alt text](/demo/shot2.jpg)

4. Go back to Terminal and type in this command to trigger the Facebbook app to send messages. Remember to use the token you requested earlier.

    ```bash
    curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=<PAGE_ACCESS_TOKEN>"
    ```

### Creating a New Slack Bot

Follow [this guide](https://github.com/mccreath/isitup-for-slack/blob/master/docs/TUTORIAL.md) to create your own bot.

(To Do: Pare down guide to relevant bits, copy here)

## Running the tests

Explain how to run the automated tests for this system

### Unit tests

Testing framework is set up, but tests are currently incomplete.

```
npm test
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Node.js](https://www.npmjs.com/) - The web framework used
* [??](https://maven.apache.org/) - Dependency Management
* [???](https://rometools.github.io/rome/) - Used to generate RSS Feeds




## Authors

* **Michael Whelpley** - *Initial work* - [whelpley](https://github.com/whelpley)

* **Jeff Whelpley** - *Advisor/Editor* - [jeffwhelpley](https://github.com/jeffwhelpley)

(delete reference to contributors?)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

(need to choose License)

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments


* Hat tip to anyone who's code was used
* Inspiration
* etc
* Thanks to the team at GetHuman
