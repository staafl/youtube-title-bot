// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const fetch = require('node-fetch');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            try {
                const text = context.activity.text;
                const rx = "https?:[/][/](www[.])?youtube[.]com[/]watch[?](.*&)?v=([^&]+)";
                const urls = text.match(new RegExp(rx, "ig"));
                //console.log(JSON.stringify(urls));
                if (urls && urls.length) {
                    for (const url of urls) {
                        const reply = await (await fetch(url)).text();
                        const matched = reply.match(/<title>([^<]+)<[/]title>/);
                        const replyText = (matched && matched.length && matched[1]) ?
                            url + ": " + matched[1] :
                            url + ": <can't find title>";
                        await context.sendActivity(MessageFactory.text(replyText, replyText));
                    }
                }
            } catch (err) {
                await context.sendActivity(MessageFactory.text(err.message, err.message));
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
