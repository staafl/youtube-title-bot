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

function request(options) {
  let reply = "";
  return new Promise((rs, rj) => {
        var callback = function(res) {
          if (res.statusCode + "" !== "200") {
            rj(new Error("Error response from server: " + res.statusCode));
            return;
          }
          //console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            //console.log(chunk);
            reply += chunk;
          });
          res.on('error', rj);

          res.on('end', function () {
            rs(reply);
          });
        };

        http.get(options, callback).end();
    });
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
            let handled = false;

            //console.log(context.activity.conversation.tenantId);
            if (context.activity.conversation &&
                (process.env.JiraTenantId &&
                context.activity.conversation.tenantId === process.env.JiraTenantId) ||
                context.activity.channelId === "emulator") {
                const seen = {};
                for (const ticket of (text.match(/\b[A-Z][A-Z0-9_]+-[1-9][0-9]*\b/g) || [])) {
                    if (seen[ticket]) {
                        continue;
                    }
                    seen[ticket] = true;
                    //await context.sendActivity(MessageFactory.text(ticket, ticket));
                    const auth = Buffer.from(process.env.JiraUser + ":" + process.env.JiraPassword).toString("base64");
                    //console.log(auth);
                    const result = await request({
                        host: "jira.tick42.com",
                        path: "/rest/api/2/issue/" + ticket + "?fields=assignee,summary,fixVersions,status",
                        headers: {
                            "Authorization": "Basic " + auth,
                            "Accept": "application/json"
                        }
                    });

                    // await context.sendActivity(MessageFactory.text(result, result));
                    const parsed = JSON.parse(result);
                    let fvString = "";
                    if (parsed.fields.fixVersions &&
                        parsed.fields.fixVersions.length) {
                        fvString = ", fix versions: " + (parsed.fields.fixVersions.map(x => x.name).join(", "));
                    }
                    //const toSend = parsed.key + ": " + parsed.fields.summary + " (" + parsed.fields.assignee.displayName + ")";
                    const toSend1 = "["+parsed.key + "](https://jira.tick42.com/browse/"+parsed.key+"): " + parsed.fields.summary + " (" + parsed.fields.assignee.displayName + ", " + parsed.fields.status + fvString + ")";
                    const toSend2 = toSend1;
                    await context.sendActivity(MessageFactory.text(toSend1, toSend2));
                    handled = true;
                }
            }

            if (!handled)
            if (text.match(/(sarcastic|condescending) laugh/i)) {
                await context.sendActivity(MessageFactory.text("Ha. Ha. Ha.", "Ha. Ha. Ha."));
            }
//            else if (text.match(/raw /)) {
//                const str = safeStringify(context);
//                await context.sendActivity(MessageFactory.text(str, str));
//            }
            else if (text.match(/\b(fuck|ass|shit|stupid|moron|dumb|cunt|fool)/i)) {
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
