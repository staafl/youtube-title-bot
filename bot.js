// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const http = require('https');
const pkg = require("./package.json");

function safeStringify(obj, indent = 2) {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
}

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
//            if (context.activity.from.role !== "user" ||
//                context.activity.recipient.role !== "bot") {
//                next();
//                return;
//            }
            const text = context.activity.text || "";
            //console.log(JSON.stringify(Object.keys(context.activity)));
            //console.log(JSON.stringify(context.activity));
            try {
            if (text.match(/(sarcastic|condescending) laugh/i)) {
                await context.sendActivity(MessageFactory.text("Ha. Ha. Ha.", "Ha. Ha. Ha."));
            } else if (text.match(/^raw /)) {
                const str = safeStringify(context);
                await context.sendActivity(MessageFactory.text(str, str));
            } else if (text.match(/\b(fuck|ass|shit|stupid|moron|dumb|cunt|fool)/i)) {
                await context.sendActivity(MessageFactory.text("Bite my shiny metal ass!", "Bite my shiny metal ass!"));
            } else if (text.match(/good bot/i)) {
                await context.sendActivity(MessageFactory.text("Good human", "Good human"));
            } else if (text.match(/version/i)) {
                await context.sendActivity(MessageFactory.text(pkg.version, pkg.version));
            } else if (text.match(/\b(hi|hello)\b/i)) {
                await context.sendActivity(MessageFactory.text("Well hello there.", "Well hello there."));
            } else if (text.match(/who's (the best|the greatest|right)/i)) {
                await context.sendActivity(MessageFactory.text("Why, Velko, of course.", "Why, Velko, of course."));
            } else {
                const rx = "https?:[/][/](www[.])?youtube[.]com[/]watch[?](.*&)?v=([a-zA-Z0-9_-]+)";
                const urls = text.match(new RegExp(rx, "ig")) || text.match(/https?:[/][/]youtu[.]be[/]([a-zA-Z0-9_-]+)/ig);
                if (urls && urls.length) {
                    for (const url_ of urls) {
                        const url = url_.replace(/https?:[/][/]youtu[.]be[/]/i, "https://www.youtube.com/watch?v=");
                        let reply = "";
                        await new Promise((rs) => {
                            var callback = function(res) {
                              //console.log(`STATUS: ${res.statusCode}`);
                              //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                              res.setEncoding('utf8');
                              res.on('data', function (chunk) {
                                reply += chunk;
                              });

                              res.on('end', function () {
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
                            http.get(options, callback).end();
                        });
                        const matched = reply.match(/<title>([^<]+)<[/]title>/);
                        const replyText = (matched && matched.length && matched[1]) ?
                            url_ + ": " + matched[1].replace(" - YouTube", "") :
                            url_ + ": <can't find title>";
                        await context.sendActivity(MessageFactory.text(replyText, replyText));
                        break;
                    }
                } else {
                    await context.sendActivity(MessageFactory.text("What? Make sense, you creature.", "What? Make sense, you creature."));
                }
            }
            }
            catch (err) {
                await context.sendActivity(MessageFactory.text("Error: " + err.message, "Error: " + err.message));
            }
            await next();
        });

//        this.onMembersAdded(async (context, next) => {
//            const membersAdded = context.activity.membersAdded;
//            const welcomeText = 'Hello and welcome!';
//            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
//                if (membersAdded[cnt].id !== context.activity.recipient.id) {
//                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
//                }
//            }
//            // By calling next() you ensure that the next BotHandler is run.
//            await next();
//        });
    }
}

module.exports.EchoBot = EchoBot;
