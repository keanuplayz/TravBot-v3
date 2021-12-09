import {db} from "../modules/database";
import {Collection} from "discord.js";

const upsert = (column: string, bindParameter: string) =>
    `INSERT INTO Guilds (ID, ${column}) VALUES (:id, :${bindParameter}) ON CONFLICT (ID) DO UPDATE SET ${column} = :${bindParameter} WHERE ID = :id`;

export class Guild {
    public readonly id: string;
    private _prefix: string | null;
    private _welcomeType: "none" | "text" | "graphical";
    private _welcomeChannel: string | null;
    private _welcomeMessage: string | null;
    private _streamingChannel: string | null;
    private _hasMessageEmbeds: boolean;
    private _streamingRoles: Collection<string, string>; // Role ID: Category Name
    private _defaultChannelNames: Collection<string, string>; // Channel ID: Channel Name
    private _autoRoles: string[]; // string array of role IDs

    constructor(id: string) {
        this.id = id;
        const data = db.prepare("SELECT * FROM Guilds WHERE ID = ?").get(id);
        const streamingRoles =
            db.prepare("SELECT RoleID, Category FROM StreamingRoles WHERE GuildID = ?").all(id) ?? [];
        const defaultChannelNames =
            db.prepare("SELECT ChannelID, Name FROM DefaultChannelNames WHERE GuildID = ?").all(id) ?? [];
        const autoRoles = db.prepare("SELECT RoleID FROM AutoRoles WHERE GuildID = ?").all(id) ?? [];

        if (data) {
            const {Prefix, WelcomeType, WelcomeChannel, WelcomeMessage, StreamingChannel, HasMessageEmbeds} = data;

            this._prefix = Prefix;
            this._welcomeType = "none";
            this._welcomeChannel = WelcomeChannel;
            this._welcomeMessage = WelcomeMessage;
            this._streamingChannel = StreamingChannel;
            this._hasMessageEmbeds = !!HasMessageEmbeds;

            switch (WelcomeType) {
                case 1:
                    this._welcomeType = "text";
                    break;
                case 2:
                    this._welcomeType = "graphical";
                    break;
            }
        } else {
            this._prefix = null;
            this._welcomeType = "none";
            this._welcomeChannel = null;
            this._welcomeMessage = null;
            this._streamingChannel = null;
            this._hasMessageEmbeds = true;
        }

        this._streamingRoles = new Collection();
        this._defaultChannelNames = new Collection();
        this._autoRoles = [];

        for (const {RoleID, Category} of streamingRoles) {
            this._streamingRoles.set(RoleID, Category);
        }

        for (const {ChannelID, Name} of defaultChannelNames) {
            this._defaultChannelNames.set(ChannelID, Name);
        }

        for (const {RoleID} of autoRoles) {
            this._autoRoles.push(RoleID);
        }
    }

    static all(): Guild[] {
        const IDs = db
            .prepare("SELECT ID FROM Guilds")
            .all()
            .map((guild) => guild.ID);
        const guilds = [];

        for (const id of IDs) {
            guilds.push(new Guild(id));
        }

        return guilds;
    }

    get prefix() {
        return this._prefix;
    }
    set prefix(prefix) {
        this._prefix = prefix;
        db.prepare(upsert("Prefix", "prefix")).run({
            id: this.id,
            prefix
        });
    }
    get welcomeType() {
        return this._welcomeType;
    }
    set welcomeType(welcomeType) {
        this._welcomeType = welcomeType;
        let welcomeTypeInt = 0;

        switch (welcomeType) {
            case "text":
                welcomeTypeInt = 1;
                break;
            case "graphical":
                welcomeTypeInt = 2;
                break;
        }

        db.prepare(upsert("WelcomeType", "welcomeType")).run({
            id: this.id,
            welcomeTypeInt
        });
    }
    get welcomeChannel() {
        return this._welcomeChannel;
    }
    set welcomeChannel(welcomeChannel) {
        this._welcomeChannel = welcomeChannel;
        db.prepare(upsert("WelcomeChannel", "welcomeChannel")).run({
            id: this.id,
            welcomeChannel
        });
    }
    get welcomeMessage() {
        return this._welcomeMessage;
    }
    set welcomeMessage(welcomeMessage) {
        this._welcomeMessage = welcomeMessage;
        db.prepare(upsert("WelcomeMessage", "welcomeMessage")).run({
            id: this.id,
            welcomeMessage
        });
    }
    get streamingChannel() {
        return this._streamingChannel;
    }
    set streamingChannel(streamingChannel) {
        this._streamingChannel = streamingChannel;
        db.prepare(upsert("StreamingChannel", "streamingChannel")).run({
            id: this.id,
            streamingChannel
        });
    }
    get hasMessageEmbeds() {
        return this._hasMessageEmbeds;
    }
    set hasMessageEmbeds(hasMessageEmbeds) {
        this._hasMessageEmbeds = hasMessageEmbeds;
        db.prepare(upsert("HasMessageEmbeds", "hasMessageEmbeds")).run({
            id: this.id,
            hasMessageEmbeds: +hasMessageEmbeds
        });
    }
    get streamingRoles() {
        return this._streamingRoles; // Role ID: Category Name
    }
    get defaultChannelNames() {
        return this._defaultChannelNames; // Channel ID: Channel Name
    }
    get autoRoles() {
        return this._autoRoles; // string array of role IDs
    }
}
