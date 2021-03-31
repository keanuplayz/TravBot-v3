import {Presence} from "discord.js";
import {client} from "../index";

declare module "discord.js" {
    interface Presence {
        patch(data: any): void;
    }
}

// The terrible hacks were written by none other than The Noble Programmer On The White PC.

// NOTE: Terrible hack ahead!!! In order to reduce the memory usage of the bot
// we only store the information from presences that we actually end up using,
// which currently is only the (online/idle/dnd/offline/...) status (see
// `src/commands/info.ts`). What data is retrieved from the `data` object
// (which contains the data received from the Gateway) and how can be seen
// here:
// <https://github.com/discordjs/discord.js/blob/cee6cf70ce76e9b06dc7f25bfd77498e18d7c8d4/src/structures/Presence.js#L81-L110>.
const oldPresencePatch = Presence.prototype.patch;
Presence.prototype.patch = function patch(data: any) {
    oldPresencePatch.call(this, {status: data.status});
};

// NOTE: Terrible hack continued!!! Unfortunately we can't receive the presence
// data at all when the GUILD_PRESENCES intent is disabled, so while we do
// waste network bandwidth and the CPU time for decoding the incoming packets,
// the function which handles those packets is NOP-ed out, which, among other
// things, skips the code which caches the referenced users in the packet. See
// <https://github.com/discordjs/discord.js/blob/cee6cf70ce76e9b06dc7f25bfd77498e18d7c8d4/src/client/actions/PresenceUpdate.js#L7-L41>.
(client["actions"] as any)["PresenceUpdate"].handle = () => {};
