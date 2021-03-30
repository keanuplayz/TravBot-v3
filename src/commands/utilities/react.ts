import Command from "../../core/command";
import {Message, Channel, TextChannel} from "discord.js";
import {queryClosestEmoteByName} from "./subcommands/emote-utils";

export default new Command({
    description:
        "Reacts to the a previous message in your place. You have to react with the same emote before the bot removes that reaction.",
    usage: 'react <emotes...> (<distance / message ID / "Copy ID" / "Copy Message Link">)',
    async run($) {
        let target: Message | undefined;
        let distance = 1;

        if ($.args.length >= 2) {
            const last = $.args[$.args.length - 1]; // Because this is optional, do not .pop() unless you're sure it's a message link indicator.
            const URLPattern = /^(?:https:\/\/discord.com\/channels\/(\d{17,19})\/(\d{17,19})\/(\d{17,19}))$/;
            const copyIDPattern = /^(?:(\d{17,19})-(\d{17,19}))$/;

            // https://discord.com/channels/<Guild ID>/<Channel ID>/<Message ID> ("Copy Message Link" Button)
            if (URLPattern.test(last)) {
                const match = URLPattern.exec(last)!;
                const guildID = match[1];
                const channelID = match[2];
                const messageID = match[3];
                let guild = $.guild;
                let channel: Channel | undefined = $.channel;

                if (guild?.id !== guildID) {
                    try {
                        guild = await $.client.guilds.fetch(guildID);
                    } catch {
                        return $.channel.send(`\`${guildID}\` is an invalid guild ID!`);
                    }
                }

                if (channel.id !== channelID) channel = guild.channels.cache.get(channelID);
                if (!channel) return $.channel.send(`\`${channelID}\` is an invalid channel ID!`);

                if ($.message.id !== messageID) {
                    try {
                        target = await (channel as TextChannel).messages.fetch(messageID);
                    } catch {
                        return $.channel.send(`\`${messageID}\` is an invalid message ID!`);
                    }
                }

                $.args.pop();
            }
            // <Channel ID>-<Message ID> ("Copy ID" Button)
            else if (copyIDPattern.test(last)) {
                const match = copyIDPattern.exec(last)!;
                const channelID = match[1];
                const messageID = match[2];
                let channel: Channel | undefined = $.channel;

                if (channel.id !== channelID) channel = $.guild?.channels.cache.get(channelID);
                if (!channel) return $.channel.send(`\`${channelID}\` is an invalid channel ID!`);

                if ($.message.id !== messageID) {
                    try {
                        target = await (channel as TextChannel).messages.fetch(messageID);
                    } catch {
                        return $.channel.send(`\`${messageID}\` is an invalid message ID!`);
                    }
                }

                $.args.pop();
            }
            // <Message ID>
            else if (/^\d{17,19}$/.test(last)) {
                try {
                    target = await $.channel.messages.fetch(last);
                } catch {
                    return $.channel.send(`No valid message found by the ID \`${last}\`!`);
                }

                $.args.pop();
            }
            // The entire string has to be a number for this to match. Prevents leaCheeseAmerican1 from triggering this.
            else if (/^\d+$/.test(last)) {
                distance = parseInt(last);

                if (distance >= 0 && distance <= 99) $.args.pop();
                else return $.channel.send("Your distance must be between 0 and 99!");
            }
        }

        if (!target) {
            // Messages are ordered from latest to earliest.
            // You also have to add 1 as well because fetchMessages includes your own message.
            target = (
                await $.message.channel.messages.fetch({
                    limit: distance + 1
                })
            ).last();
        }

        for (const search of $.args) {
            // Even though the bot will always grab *some* emote, the user can choose not to keep that emote there if it isn't what they want
            const emote = queryClosestEmoteByName(search);
            const reaction = await target!.react(emote);

            // This part is called with a promise because you don't want to wait 5 seconds between each reaction.
            setTimeout(() => {
                // This reason for this null assertion is that by the time you use this command, the client is going to be loaded.
                reaction.users.remove($.client.user!);
            }, 5000);
        }

        return;
    }
});
