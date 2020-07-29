// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const http = require('https');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const text = context.activity.text;
            if (text.match(/good bot/i)) {
                await context.sendActivity(MessageFactory.text("Good human", "Good human"));
            } else if (text.match(/version/i)) {
                await context.sendActivity(MessageFactory.text("0.0.2", "0.0.2"));
            } else {
                try {
                    const rx = "https?:[/][/](www[.])?youtube[.]com[/]watch[?](.*&)?v=([a-zA-Z0-9]+)";
                    const urls = text.match(new RegExp(rx, "ig"));
                    //console.log(JSON.stringify(urls));
                    if (urls && urls.length) {
                        for (const url of urls) {

                            let reply = "";
                            await new Promise((rs) => {
                                var callback = function(res) {
                                  //console.log(`STATUS: ${res.statusCode}`);
                                  //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                                  res.setEncoding('utf8');
                                  res.on('data', function (chunk) {
                                    reply += chunk;
                                    //console.log("chunk" + chunk)
                                  });

                                  res.on('end', function () {
                                    //console.log('end');
                                    rs();
                                  });
                                };

                                const options = {
                                    host: "www.youtube.com",
                                    path: url.replace(/.*[.]com[/]/i, "/"),
                                    headers: {
                                      accept: "*/*",
                                      ["user-agent"]: "curl"
                                    }
                                };
                                //console.log(options);
                                http.get(options, callback).end();
                            });
                            const matched = reply.match(/<title>([^<]+)<[/]title>/);
                            //console.log(reply);
                            const replyText = (matched && matched.length && matched[1]) ?
                                url + ": " + matched[1] :
                                url + ": <can't find title>";
                            await context.sendActivity(MessageFactory.text(replyText, replyText));
                        }
                    }
                } catch (err) {
                    await context.sendActivity(MessageFactory.text(err.message, err.message));
                }
            }
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.EchoBot = EchoBot;
