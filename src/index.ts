import "./modules/globals";
import {Client, Permissions} from "discord.js";
import path from "path";

// This is here in order to make it much less of a headache to access the client from other files.
// This of course won't actually do anything until the setup process is complete and it logs in.
export const client = new Client();

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
                (member.hasPermission(Permissions.FLAGS.MANAGE_ROLES) ||
                    member.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES) ||
                    member.hasPermission(Permissions.FLAGS.KICK_MEMBERS) ||
                    member.hasPermission(Permissions.FLAGS.BAN_MEMBERS))
        },
        {
            // ADMIN //
            name: "Administrator",
            check: (_user, member) => !!member && member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
        },
        {
            // OWNER //
            name: "Server Owner",
            check: (_user, member) => !!member && member.guild.ownerID === member.id
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
import "./modules/lavalink";
import "./modules/emoteRegistry";
import "./modules/systemInfo";
import "./modules/intercept";
import "./modules/messageEmbed";
import "./modules/guildMemberAdd";
import "./modules/streamNotifications";
