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

            //console.log(context.activity.conversation.tenantId);
            const from = context.activity.from.name.replace(/ .*/, "");
            if (text.match(/\btell (.*)/i)) {
                const toTell = text
                    .replace(/^.*?\btell ([^ ]+) \b(to )?/i, function(_, whom) {
                        return whom.substring(0, 1).toUpperCase() + whom.substring(1) + ", ";
                    })
                    .replace(/\bme\b/ig, from)
                    .replace(/\bI\b/ig, from)
                    .replace(/\bmy\b/ig, from + "'s")
                    .replace(/\b('|&apos;)m\b/ig, "'s")
                    .replace(/\b('|&apos;)ve\b/ig, "'s")
                    .replace(/\bam\b/ig, "is")
                    .replace(/\bhe('|&apos;)s\b/ig, "you're")
                    .replace(/\bshe('|&apos;)s\b/ig, "you're")
                    .replace(/\bhas\b/ig, "have")
                    .replace(/\bhim\b/ig, "you")
                    .replace(/\bhimself\b/ig, "yourself")
                    .replace(/\bhis\b/ig, "your")
                    .replace(/\bhers\b/ig, "your")
                    .replace(/\bherself\b/ig, "yourself")
                    .replace(/\bher\b/ig, "you")
                    .replace(/\bhe\b/ig, "you")
                    .replace(/\bshe\b/ig, "you")
                    .replace(/\btheirs\b/ig, "yours")
                    .replace(/\btheir\b/ig, "your")
                    .replace(/\bthemselves\b/ig, "yourselves")
                    .replace(/\bthem\b/ig, "you")
                    .replace(/\byou ([^ ]+)s\b/ig, "you $1")
                    .replace(/s('|&apos;)s/ig, "s'")

                await context.sendActivity(MessageFactory.text(toTell, toTell));
            } else if (text.match(/\bplease\b/ig)) {
                let toTell = text.replace(
                    /^.*?\bplease\b +([^ ]+) ?(.*)/i, function(_, verb, rest) {
                        if (verb.match(/(sh|ch|x|z|ss|o)$/ig)) {
                            verb += "es";
                        } else if (verb.match(/[^aeoiu]y$/ig)) {
                            verb = verb.replace(/([^aeoiu])y$/ig, "$1ies");
                        } else {
                            verb += "s";
                        }
                        verb = verb.substring(0, 1).toUpperCase() + verb.substring(1).toLowerCase();
                        rest = rest
                            .replace(/\bme\b/ig, from)
                            .replace(/\bmy\b/ig, from + "'s")
                            .replace(/s('|&apos;)s/ig, "s'")

                        return "*" + (verb + " " + rest).trim() + "*";
                    });
                await context.sendActivity(MessageFactory.text(toTell, toTell));
            } else if (text.match(/(sarcastic|condescending) laugh/i)) {
                await context.sendActivity(MessageFactory.text("Ha. Ha. Ha.", "Ha. Ha. Ha."));
            }
//            else if (text.match(/raw /)) {
//                const str = safeStringify(context);
//                await context.sendActivity(MessageFactory.text(str, str));
//            }
            else if (text.match(/\b(thanks|thank you|10x)\b/i)) {
                await context.sendActivity(MessageFactory.text("Anything for you, my pretty!", "Anything for you, my pretty!"));
            } else if (text.match(/\b(fuck|ass|shit|stupid|moron|dumb|cunt|fool)/i)) {
                await context.sendActivity(MessageFactory.text("Bite my shiny metal ass!", "Bite my shiny metal ass!"));
            } else if (text.match(/good bot/i)) {
                await context.sendActivity(MessageFactory.text("Good human", "Good human"));
            } else if (text.match(/version/i)) {
                await context.sendActivity(MessageFactory.text(pkg.version, pkg.version));
            } else if (text.match(/\b(hi|hello)\b/i)) {
                await context.sendActivity(MessageFactory.text("Well hello there.", "Well hello there."));
            } else if (text.match(/who[^a-z]s (the best|the greatest|right)/i)) {
                await context.sendActivity(MessageFactory.text("Why, Velko, of course.", "Why, Velko, of course."));
            } else if (text.match(/https:[/][/]twitter[.]com[/][^/]+[/]status[/]([^?/]+?)[?]?\b/)) {
                const match = text.match(/https:[/][/]twitter[.]com[/][^/]+[/]status[/]([^?/]+?)[?]?\b/);
                const result = JSON.parse(await request(
                    {
                        host: "api.twitter.com",
                        path: "/1.1/statuses/show.json?id=" + match[1] + "&tweet_mode=extended",
                        headers: {
                            Accept: "application/json",
                            Authorization: "Bearer " + process.env.TwitterBearer
                        }
                    }));

                const toTell = result.user.name + ": " + (result.full_text || result.text);
                await context.sendActivity(MessageFactory.text(toTell, toTell));
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
