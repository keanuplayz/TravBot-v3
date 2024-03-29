import "./modules/globals";
import {Client, Permissions, Intents} from "discord.js";
import path from "path";

// This is here in order to make it much less of a headache to access the client from other files.
// This of course won't actually do anything until the setup process is complete and it logs in.
export const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES
    ]
});

import {launch} from "onion-lasers";
import setup from "./modules/setup";
import {Config, getPrefix} from "./structures";
import {toTitleCase} from "./lib";

// Send the login request to Discord's API and then load modules while waiting for it.
setup.init().then(() => {
    client.login(Config.token).catch(setup.again);
});

// Setup the command handler.
launch(client, path.join(__dirname, "commands"), {
    getPrefix,
    categoryTransformer: toTitleCase,
    permissionLevels: [
        {
            // NONE //
            name: "User",
            check: () => true
        },
        {
            // MOD //
            name: "Moderator",
            check: (_user, member) =>
                !!member &&
                (member.permissions.has(Permissions.FLAGS.MANAGE_ROLES) ||
                    member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES) ||
                    member.permissions.has(Permissions.FLAGS.KICK_MEMBERS) ||
                    member.permissions.has(Permissions.FLAGS.BAN_MEMBERS))
        },
        {
            // ADMIN //
            name: "Administrator",
            check: (_user, member) => !!member && member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
        },
        {
            // OWNER //
            name: "Server Owner",
            check: (_user, member) => !!member && member.guild.ownerId === member.id
        },
        {
            // BOT_SUPPORT //
            name: "Bot Support",
            check: (user) => Config.support.includes(user.id)
        },
        {
            // BOT_ADMIN //
            name: "Bot Admin",
            check: (user) => Config.admins.includes(user.id)
        },
        {
            // BOT_OWNER //
            name: "Bot Owner",
            check: (user) => Config.owner === user.id
        }
    ]
});

// Initialize Modules //
import "./modules/ready";
import "./modules/presence";
// TODO: Reimplement entire music system, contact Sink
// import "./modules/lavalink";
import "./modules/emoteRegistry";
import "./modules/systemInfo";
import "./modules/intercept";
// import "./modules/messageEmbed";
import "./modules/guildMemberAdd";
import "./modules/streamNotifications";
import "./modules/channelDefaults";
// This module must be loaded last for the dynamic event reading to work properly.
import "./modules/eventLogging";
