// Contains all the permission roles and checking functions.
import {User, GuildMember} from "discord.js";
import {permissionLevels} from "./interface";

/**
 * Checks if a `Member` has a certain permission.
 */
export function hasPermission(user: User, member: GuildMember | null, permission: number): boolean {
    if (permissionLevels.length === 0) return true;
    for (let i = permissionLevels.length - 1; i >= permission; i--)
        if (permissionLevels[i].check(user, member)) return true;
    return false;
}

/**
 * Gets a `Member`'s permission level according to the permissions enum defined in the file.
 */
export function getPermissionLevel(user: User, member: GuildMember | null): number {
    for (let i = permissionLevels.length - 1; i >= 0; i--) if (permissionLevels[i].check(user, member)) return i;
    return 0;
}

export function getPermissionName(level: number) {
    if (level > permissionLevels.length || level < 0 || permissionLevels.length === 0) return "N/A";
    else return permissionLevels[level].name;
}
