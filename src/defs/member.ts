import {db} from "../modules/database";

export class Member {
    public readonly userID: string;
    public readonly guildID: string;
    private _streamCategory: string | null;

    constructor(userID: string, guildID: string) {
        this.userID = userID;
        this.guildID = guildID;
        const data = db.prepare("SELECT * FROM Members WHERE UserID = ? AND GuildID = ?").get(userID, guildID);

        if (data) {
            const {StreamCategory} = data;
            this._streamCategory = StreamCategory;
        } else {
            this._streamCategory = null;
        }
    }

    static all(): Member[] {
        const IDs = db.prepare("SELECT UserID, GuildID FROM Members").all();
        const members = [];

        for (const {UserID, GuildID} of IDs) {
            members.push(new Member(UserID, GuildID));
        }

        return members;
    }

    get streamCategory() {
        return this._streamCategory;
    }
    set streamCategory(streamCategory) {
        this._streamCategory = streamCategory;
        db.prepare("INSERT INTO Members VALUES (?, ?, ?)").run(this.userID, this.guildID, streamCategory);
    }
}
