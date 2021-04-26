// Contains all the code handling dynamic JSON data. Has a one-to-one connection with each file generated, for example, `Config` which calls `super("config")` meaning it writes to `data/config.json`.
import FileManager from "./modules/storage";
import {select, GenericJSON, GenericStructure} from "./lib";
import {watch} from "fs";
import {Guild as DiscordGuild, Snowflake} from "discord.js";

// Maybe use getters and setters to auto-save on set?
// And maybe use Collections/Maps instead of objects?

class ConfigStructure extends GenericStructure {
    public token: string;
    public prefix: string;
    public owner: string;
    public admins: string[];
    public support: string[];
    public systemLogsChannel: string | null;

    constructor(data: GenericJSON) {
        super("config");
        this.token = select(data.token, "<ENTER YOUR TOKEN HERE>", String);
        this.prefix = select(data.prefix, "$", String);
        this.owner = select(data.owner, "", String);
        this.admins = select(data.admins, [], String, true);
        this.support = select(data.support, [], String, true);
        this.systemLogsChannel = select(data.systemLogsChannel, null, String);
    }
}

class User {
    public money: number;
    public lastReceived: number;
    public lastMonday: number;
    public timezone: number | null; // This is for the standard timezone only, not the daylight savings timezone
    public daylightSavingsRegion: "na" | "eu" | "sh" | null;
    public todoList: {[timestamp: string]: string};
    public ecoBetInsurance: number;

    constructor(data?: GenericJSON) {
        this.money = select(data?.money, 0, Number);
        this.lastReceived = select(data?.lastReceived, -1, Number);
        this.lastMonday = select(data?.lastMonday, -1, Number);
        this.timezone = data?.timezone ?? null;
        this.daylightSavingsRegion = /^((na)|(eu)|(sh))$/.test(data?.daylightSavingsRegion)
            ? data?.daylightSavingsRegion
            : null;
        this.todoList = {};
        this.ecoBetInsurance = select(data?.ecoBetInsurance, 0, Number);

        if (data) {
            for (const timestamp in data.todoList) {
                const note = data.todoList[timestamp];
                if (typeof note === "string") {
                    this.todoList[timestamp] = note;
                }
            }
        }
    }
}

class Member {
    public streamCategory: string | null;

    constructor(data?: GenericJSON) {
        this.streamCategory = select(data?.streamCategory, null, String);
    }
}

class Guild {
    public prefix: string | null;
    public welcomeType: "none" | "text" | "graphical";
    public welcomeChannel: string | null;
    public welcomeMessage: string | null;
    public streamingChannel: string | null;
    public streamingRoles: {[role: string]: string}; // Role ID: Category Name
    public channelNames: {[channel: string]: string};
    public members: {[id: string]: Member};

    constructor(data?: GenericJSON) {
        this.prefix = select(data?.prefix, null, String);
        this.welcomeChannel = select(data?.welcomeChannel, null, String);
        this.welcomeMessage = select(data?.welcomeMessage, null, String);
        this.streamingChannel = select(data?.streamingChannel, null, String);
        this.streamingRoles = {};
        this.channelNames = {};
        this.members = {};

        switch (data?.welcomeType) {
            case "text":
                this.welcomeType = "text";
                break;
            case "graphical":
                this.welcomeType = "graphical";
                break;
            default:
                this.welcomeType = "none";
                break;
        }

        if (data?.streamingRoles) {
            for (const id in data.streamingRoles) {
                const category = data.streamingRoles[id];

                if (/\d{17,}/g.test(id) && typeof category === "string") {
                    this.streamingRoles[id] = category;
                }
            }
        }

        if (data?.channelNames) {
            for (const id in data.channelNames) {
                const name = data.channelNames[id];

                if (/\d{17,}/g.test(id) && typeof name === "string") {
                    this.channelNames[id] = name;
                }
            }
        }

        if (data?.members) {
            for (let id in data.members) {
                if (/\d{17,}/g.test(id)) {
                    this.members[id] = new Member(data.members[id]);
                }
            }
        }
    }

    /** Gets a member's profile if they exist and generate one if not. */
    public getMember(id: string): Member {
        if (!/\d{17,}/g.test(id))
            console.warn(`"${id}" is not a valid user ID! It will be erased when the data loads again.`);

        if (id in this.members) return this.members[id];
        else {
            const member = new Member();
            this.members[id] = member;
            return member;
        }
    }
}

class StorageStructure extends GenericStructure {
    public users: {[id: string]: User};
    public guilds: {[id: string]: Guild};

    constructor(data: GenericJSON) {
        super("storage");
        this.users = {};
        this.guilds = {};
        for (let id in data.users) if (/\d{17,}/g.test(id)) this.users[id] = new User(data.users[id]);
        for (let id in data.guilds) if (/\d{17,}/g.test(id)) this.guilds[id] = new Guild(data.guilds[id]);
    }

    /** Gets a user's profile if they exist and generate one if not. */
    public getUser(id: string): User {
        if (!/\d{17,}/g.test(id))
            console.warn(`"${id}" is not a valid user ID! It will be erased when the data loads again.`);

        if (id in this.users) return this.users[id];
        else {
            const user = new User();
            this.users[id] = user;
            return user;
        }
    }

    /** Gets a guild's settings if they exist and generate one if not. */
    public getGuild(id: string): Guild {
        if (!/\d{17,}/g.test(id))
            console.warn(`"${id}" is not a valid guild ID! It will be erased when the data loads again.`);

        if (id in this.guilds) return this.guilds[id];
        else {
            const guild = new Guild();
            this.guilds[id] = guild;
            return guild;
        }
    }
}

// Exports instances. Don't worry, importing it from different files will load the same instance.
export let Config = new ConfigStructure(FileManager.read("config"));
export let Storage = new StorageStructure(FileManager.read("storage"));

// This part will allow the user to manually edit any JSON files they want while the program is running which'll update the program's cache.
// However, fs.watch is a buggy mess that should be avoided in production. While it helps test out stuff for development, it's not a good idea to have it running outside of development as it causes all sorts of issues.
if (IS_DEV_MODE) {
    watch("data", (event, filename) => {
        console.debug("File Watcher:", event, filename);
        const header = filename.substring(0, filename.indexOf(".json"));

        switch (header) {
            case "config":
                Config = new ConfigStructure(FileManager.read("config"));
                break;
            case "storage":
                Storage = new StorageStructure(FileManager.read("storage"));
                break;
        }
    });
}

/**
 * Get the current prefix of the guild or the bot's prefix if none is found.
 */
export function getPrefix(guild: DiscordGuild | null): string {
    let prefix = Config.prefix;

    if (guild) {
        const possibleGuildPrefix = Storage.getGuild(guild.id).prefix;

        // Here, lossy comparison works in our favor because you wouldn't want an empty string to trigger the prefix.
        if (possibleGuildPrefix) {
            prefix = possibleGuildPrefix;
        }
    }

    return prefix;
}

export interface EmoteRegistryDumpEntry {
    ref: string;
    id: Snowflake;
    name: string;
    requires_colons: boolean;
    animated: boolean;
    url: string;
    guild_id: Snowflake;
    guild_name: string;
}

export interface EmoteRegistryDump {
    version: number;
    list: EmoteRegistryDumpEntry[];
}
