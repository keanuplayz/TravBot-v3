import {Client, User, GuildMember, Guild} from "discord.js";
import {attachMessageHandlerToClient} from "./handler";
import {attachEventListenersToClient} from "./eventListeners";

interface LaunchSettings {
    permissionLevels: PermissionLevel[];
    getPrefix: (guild: Guild | null) => string;
}

export async function launch(client: Client, settings: LaunchSettings) {
    attachMessageHandlerToClient(client);
    attachEventListenersToClient(client);
    permissionLevels = settings.permissionLevels;
    getPrefix = settings.getPrefix;
}

interface PermissionLevel {
    name: string;
    check: (user: User, member: GuildMember | null) => boolean;
}

export let permissionLevels: PermissionLevel[] = [];
export let getPrefix: (guild: Guild | null) => string = () => ".";
