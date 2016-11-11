let request = require('request');
let express = require('express');
let app = express();

const DONE = `
            <html>
                <body>
                    <h1>DONE!</h1>
                </body>
            </html>
        `;

const SLACKBTN = `
            <html>
                <body>
                    <a href="https://slack.com/oauth/authorize?scope=incoming-webhook,commands&client_id=2395589825.100394872743"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
                </body>
            </html>
        `;

function process(req, res) {
    let code = req.query && req.query.code;

    if (code) {
        let opts = {
            method: 'POST',
            url: 'https://slack.com/api/oauth.access',
            qs: {
                'client_id': '',
                'client_secret': '',
                'code': code
            }
        };
        request(opts, function (err, resp, body){
            res.send(DONE);
        });
    } else {
        res.send(SLACKBTN);
    }
}

app.get('/', process);
app.get('/:foo', process);

app.listen(8181, function() {
    console.log('API listening for bots on port 8181');
});