import {User, GuildMember, Permissions} from "discord.js";
import {Config} from "./structures";

interface PermissionLevel {
    name: string;
    check: (user: User, member: GuildMember | null) => boolean;
}

export const PermissionLevels: PermissionLevel[] = [
    {
        // NONE //
        name: "User",
        check: () => true
    },
    {
        // MOD //
        name: "Moderator",
        check: (_, member) =>
            !!member &&
            (member.hasPermission(Permissions.FLAGS.MANAGE_ROLES) ||
                member.hasPermission(Permissions.FLAGS.MANAGE_MESSAGES) ||
                member.hasPermission(Permissions.FLAGS.KICK_MEMBERS) ||
                member.hasPermission(Permissions.FLAGS.BAN_MEMBERS))
    },
    {
        // ADMIN //
        name: "Administrator",
        check: (_, member) => !!member && member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
    },
    {
        // OWNER //
        name: "Server Owner",
        check: (_, member) => !!member && member.guild.ownerID === member.id
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
];

// After checking the lengths of these three objects, use this as the length for consistency.
const length = PermissionLevels.length;

export function hasPermission(member: GuildMember, permission: number): boolean {
    for (let i = length - 1; i >= permission; i--) if (PermissionLevels[i].check(member.user, member)) return true;
    return false;
}

export function getPermissionLevel(member: GuildMember): number {
    for (let i = length - 1; i >= 0; i--) if (PermissionLevels[i].check(member.user, member)) return i;
    return 0;
}

export function getPermissionName(level: number) {
    if (level > length || level < 0) return "N/A";
    else return PermissionLevels[level].name;
}
