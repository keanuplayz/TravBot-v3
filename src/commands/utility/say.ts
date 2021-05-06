import {NamedCommand, RestCommand, CHANNEL_TYPE} from "onion-lasers";
import {TextChannel, NewsChannel, Permissions} from "discord.js";
import {searchNearestEmote} from "../utility/modules/emote-utils";
import {resolveWebhook} from "../../modules/webhookStorageManager";
import {parseVarsCallback} from "../../lib";

// Description //
// This is the message-based counterpart to the react command, which replicates Nitro's ability to send emotes in messages.
// This takes advantage of webhooks' ability to change the username and avatar per request.
// Uses "@user says:" as a fallback in case no webhook is set for the channel.

// Limitations / Points of Interest //
// - Webhooks can fetch any emote in existence and use it as long as it hasn't been deleted.
// - The emote name from <:name:id> DOES matter if the user isn't part of that guild. That's the fallback essentially, otherwise, it doesn't matter.
// - The animated flag must be correct. <:name:id> on an animated emote will make it not animated, <a:name:id> will display an invalid image.
// - Rate limits for webhooks shouldn't be that big of an issue (5 requests every 2 seconds).
export default new NamedCommand({
    aliases: ["s"],
    channelType: CHANNEL_TYPE.GUILD,
    description: "Repeats your message with emotes in /slashes/.",
    usage: "<message>",
    run: "Please provide a message for me to say!",
    any: new RestCommand({
        description: "Message to repeat.",
        async run({send, channel, author, member, message, combined, guild}) {
            const webhook = await resolveWebhook(channel as TextChannel | NewsChannel);

            if (webhook) {
                const resolvedMessage = resolveMessageWithEmotes(combined);

                if (resolvedMessage)
                    webhook.send(resolvedMessage, {
                        username: member!.nickname ?? author.username,
                        // Webhooks cannot have animated avatars, so requesting the animated version is a moot point.
                        avatarURL:
                            author.avatarURL({
                                format: "png"
                            }) || author.defaultAvatarURL,
                        allowedMentions: {parse: []}, // avoids double pings
                        // "embeds" will not be included because it messes with the default ones that generate
                        files: message.attachments.array()
                    });
                else send("Cannot send an empty message.");
            } else {
                const resolvedMessage = resolveMessageWithEmotes(combined);
                if (resolvedMessage) send(`*${author} says:*\n${resolvedMessage}`, {allowedMentions: {parse: []}});
                else send("Cannot send an empty message.");
            }

            if (guild!.me?.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES)) message.delete();
        }
    })
});

const FETCH_EMOTE_PATTERN = /^(\d{17,})(?: ([^ ]+?))?(?: (a))?$/;

// Send extra emotes only for webhook messages (because the bot user can't fetch any emote in existence while webhooks can).
function resolveMessageWithEmotes(text: string, extraEmotes?: null): string {
    return parseVarsCallback(
        text,
        (variable) => {
            if (FETCH_EMOTE_PATTERN.test(variable)) {
                // Although I *could* make this ping the CDN to see if gif exists to see whether it's animated or not, it'd take too much time to wait on it.
                // Plus, with the way this function is setup, I wouldn't be able to incorporate a search without changing the function to async.
                const [_, id, name, animated] = FETCH_EMOTE_PATTERN.exec(variable)!;
                return `<${animated ?? ""}:${name ?? "_"}:${id}>`;
            }

            return searchNearestEmote(variable);
        },
        "/"
    );
}
