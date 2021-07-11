// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const http = require('https');
const pkg = require("./package.json");

var escapeChars = {
  'cent': '¢',
  'pound': '£',
  'yen': '¥',
  'euro': '€',
  'copy' :'©',
  'reg': '®',
  'lt': '<',
  'gt': '>',
  'quot': '"',
  'amp': '&',
  'apos': '\'',
  '#39': '\''
};

var regexString = '';
for(var key in escapeChars) {
  regexString += "&" + key + ";|";
}
regexString=regexString.replace(/[|]$/, "");

var regex = new RegExp( regexString, 'g');

function escapeHTML(str) {
  return str.replace(regex, function(m) {
    return escapeChars[(m||"").replace(/&|;/g, "")] || "";
  }).replace(/<br[/]?>/g, "") || "";
};

const { GoogleSpreadsheet } = require('google-spreadsheet');

function getHost(url) {
    return url.replace(/(https?:[/][/][^/]+)(?:[/].*)?/i, "$1");
}
function getPath(url) {
    return url.replace(/(?:https?:[/][/][^/]+)([/].*)?/i, "$1").replace(/#.*/, "");
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

            const maxPlayers = 20;
            //console.log(context.activity.conversation.tenantId);
            const from = context.activity.from.name.replace(/ .*/, "");
            let evalRegex = /(?:^|bot *(?:<[/]at>)?) *eval\b (.+)/sm;

            await context.sendActivity(MessageFactory.text("xhere", "xhere"));
            let evalMatch = (escapeHTML(text)||"");
            await context.sendActivity(MessageFactory.text("xhere1", "xhere"));
            evalMatch = evalMatch.replace(/\n/g, "");
            await context.sendActivity(MessageFactory.text("xhere2", "xhere"));
            evalMatch = evalMatch.replace(/\r/g, "");
            await context.sendActivity(MessageFactory.text("xhere3", "xhere"));
            evalMatch = evalMatch.trim();
            await context.sendActivity(MessageFactory.text("xhere4", "xhere"));
            evalMatch = evalMatch.match(evalRegex);
            await context.sendActivity(MessageFactory.text("xhere5", "xhere"));
            await context.sendActivity(MessageFactory.text(JSON.stringify(evalMatch), JSON.stringify(evalMatch)));

            if (evalMatch) {
                //await context.send(evalMatch[1], true);
                //await context.send(JSON.stringify(eval(evalMatch[1])), true);
                await context.sendActivity(MessageFactory.text("there", "there"));
                let result = eval(evalMatch[1]);//.split(/\n/);
                if (typeof result === "object") {
                    result = JSON.stringify(result)
                }
/*
{code}
eval ["  /\\ ___ /\\", " (  o   o  )", "  \\  >#<  /", "  /       \\", " /         \\       ^", "|           |     //", " \\         /    //", "  ///  ///   --"].join("\n")
{code}
*/
                await context.sendActivity(MessageFactory.text("where", "where"));
                await context.sendActivity(MessageFactory.text(result + "", result + ""));
                return;
            }
            else if (text.match(/\bcovid\b *(\b[a-z][a-z]\b)?/i)) {
                const result = await (await fetch("https://api.covid19api.com/summary")).json();
                const cc = (text.match(/\bcovid\b *(\b[a-z][a-z]\b)?/i)[1] || "BG").toUpperCase();
                const bg = result.Countries.find(x => x.CountryCode === cc);
                let toPrint;
                if (!bg) {
                    toPrint = "WTF country is " + cc;
                } else {
                    toPrint = new Date().toISOString().substring(0,10) + " New Cases " + cc + ": " + numberWithCommas(bg.NewConfirmed) + ", Total: " + numberWithCommas(bg.TotalConfirmed);
                }
                await context.sendActivity(MessageFactory.text(toPrint, toPrint));

            } else if (text.match(/\btennis42 ranking\b/i)) {
                const user = text.match(/\btennis42 ranking\b/i)[1];
                const doc = new GoogleSpreadsheet('1tnQpc_0Seq2ukjxVLBoiJ1ejcVL9bBP5auFUq5op_Kw');

                doc.useServiceAccountAuth({
                  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                });

                await doc.loadInfo();

                const sheet = doc.sheetsByIndex[1];
                await sheet.loadCells('C3:E' + maxPlayers);
                const players = [];
                for (let ii = 3; ii < maxPlayers; ii += 1) {
                    const games = sheet.getCellByA1("E" + ii).value + "";
                    if (games > 0) {
                        players.push({
                            name: sheet.getCellByA1("C" + ii).value,
                            elo: sheet.getCellByA1("D" + ii).value,
                            provisional: parseInt(games) < 10,
                            games
                        });
                    }
                }
                players.sort((x, y) => {
                    if (x.elo > y.elo) {
                        return -1;
                    } else if (x.elo < y.elo) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                let rank = 1;
                for (let ii = 0; ii < players.length; ii += 1) {
                    players[ii].rank = rank;
                    if (ii < players.length - 1 && players[ii + 1].elo < players[ii].elo) {
                        rank += 1;
                    }
                }

                const toPrint = players
                    .map(x =>
                        x.rank + " " +
                        x.name + " " +
                        x.elo +
                        (x.provisional ? " (provisional)" : "") +
                        " - " + x.games + " games")
                    .join("\r\n");

                await context.sendActivity(MessageFactory.text(toPrint, toPrint));

            } else if (text.match(/\btennis42 elo ([^ ]+)\b/i)) {
                const user = text.match(/\btennis42 elo ([^ ]+)\b/i)[1];
                const doc = new GoogleSpreadsheet('1tnQpc_0Seq2ukjxVLBoiJ1ejcVL9bBP5auFUq5op_Kw');

                doc.useServiceAccountAuth({
                  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                });
                await doc.loadInfo();

                const sheet = doc.sheetsByIndex[1];
                await sheet.loadCells('C3:E20');
                let toPrint = "Who the fuck is " + user + "?";
                for (let ii = 3; ii < maxPlayers; ii += 1) {
                    console.log(ii);
                    const a1 = sheet.getCellByA1("C" + ii);
                    const games = sheet.getCellByA1("E" + ii).value;
                    //toPrint = a1.value;
                    if (a1.value === user) {
                        toPrint = sheet.getCellByA1("D" + ii).value + " (" +
                            games + " games" + ((games < 10) ? " - provisional)" : ")");
                        break;
                    }
                }

                await context.sendActivity(MessageFactory.text(toPrint, toPrint));

            } else if (text.match(/\btennis42 record ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+)?\b/i)) {
                const [_, date, user1, user2, score] = text.match(/\btennis42 record ([^ ]+) ([^ ]+) ([^ ]+)\b/i);
                const doc = new GoogleSpreadsheet('1tnQpc_0Seq2ukjxVLBoiJ1ejcVL9bBP5auFUq5op_Kw');

                doc.useServiceAccountAuth({
                  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                });
                await doc.loadInfo();

                const sheet = doc.sheetsByIndex[2];
                await sheet.addRow([user1, user2, date, 1, "", "", score])

                const rows = await sheet.getRows()

                const toPrint = "Done, " + rows.length + " games recorded.";
                await context.sendActivity(MessageFactory.text(toPrint, toPrint));

            } else if (text.match(/\btell (.*)/i)) {
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
            } else if (text.match(/https:[/][/](?:[^/]+[.])?twitter[.]com[/][^/]+[/]status[/]([^?/]+?)[?]?\b/)) {
                const match = text.match(/https:[/][/](?:[^/]+[.])?twitter[.]com[/][^/]+[/]status[/]([^?/]+?)[?]?\b/);
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
            } else if (text.match(/\btitle /i)) {
                let reply = "";
                const url = text.match(/https?.*/);
                await context.sendActivity(MessageFactory.text(getHost(url) + " " + getPath(url), getHost(url) + " " + getPath(url)));
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
                        host: getHost(url),
                        path: getPath(url),
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
                return;
            } else {
                const rx = "https?:[/][/](www[.])?(m[.])?youtube[.]com[/]watch[?](.*?(&|&amp;))?v=([a-zA-Z0-9_-]+)";
                const urls =
                    text.match(new RegExp(rx, "ig")) ||
                    text.match(/https?:[/][/](www[.])?(m[.])?youtu[.]be[/]([a-zA-Z0-9_-]+)/ig);

                if (urls && urls.length) {
                    for (const url_ of urls) {
                        const url = url_
                            .replace(
                                /https?:[/][/](www[.])?(m[.])?youtu[.]be[/]/i,
                                "https://www.youtube.com/watch?v=")
                            .replace(/m[.]youtube[.]/i, "youtube.")
                            .replace(/[/][^/]+[&|?](amp;)?v=/, "/watch?v=");

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
