import {db} from "../modules/database";
import {Collection} from "discord.js";

const upsert = (column: string, bindParameter: string) =>
    `INSERT INTO Users (ID, ${column}) VALUES (:id, :${bindParameter}) ON CONFLICT (ID) DO UPDATE SET ${column} = :${bindParameter} WHERE ID = :id`;

export class User {
    public readonly id: string;
    private _money: number;
    private _lastReceived: number;
    private _lastMonday: number;
    private _timezoneOffset: number | null; // This is for the standard timezone only, not the daylight savings timezone
    private _daylightSavingsRegion: "na" | "eu" | "sh" | "none";
    private _ecoBetInsurance: number;
    private _todoList: Collection<number, {lastModified: Date; entry: string}>;

    constructor(id: string) {
        this.id = id;
        const data = db.prepare("SELECT * FROM Users WHERE ID = ?").get(id);
        const todoList = db.prepare("SELECT ID, LastModified, Entry FROM TodoLists WHERE UserID = ?").all(id) ?? [];

        if (data) {
            const {Money, LastReceived, LastMonday, TimezoneOffset, DaylightSavingsRegion, EcoBetInsurance} = data;

            this._money = Money;
            this._lastReceived = LastReceived;
            this._lastMonday = LastMonday;
            this._timezoneOffset = TimezoneOffset;
            this._daylightSavingsRegion = "none";
            this._ecoBetInsurance = EcoBetInsurance;

            switch (DaylightSavingsRegion) {
                case 1:
                    this._daylightSavingsRegion = "na";
                    break;
                case 2:
                    this._daylightSavingsRegion = "eu";
                    break;
                case 3:
                    this._daylightSavingsRegion = "sh";
                    break;
            }
        } else {
            this._money = 0;
            this._lastReceived = -1;
            this._lastMonday = -1;
            this._timezoneOffset = null;
            this._daylightSavingsRegion = "none";
            this._ecoBetInsurance = 0;
        }

        this._todoList = new Collection();

        for (const {ID, LastModified, Entry} of todoList) {
            this._todoList.set(ID, {
                entry: Entry,
                lastModified: new Date(LastModified)
            });
        }
    }

    static all(): User[] {
        const IDs = db
            .prepare("SELECT ID FROM Users")
            .all()
            .map((user) => user.ID);
        const users = [];

        for (const id of IDs) {
            users.push(new User(id));
        }

        return users;
    }

    get money() {
        return this._money;
    }
    set money(money) {
        this._money = money;
        db.prepare(upsert("Money", "money")).run({
            id: this.id,
            money
        });
    }
    get lastReceived() {
        return this._lastReceived;
    }
    set lastReceived(lastReceived) {
        this._lastReceived = lastReceived;
        db.prepare(upsert("LastReceived", "lastReceived")).run({
            id: this.id,
            lastReceived
        });
    }
    get lastMonday() {
        return this._lastMonday;
    }
    set lastMonday(lastMonday) {
        this._lastMonday = lastMonday;
        db.prepare(upsert("LastMonday", "lastMonday")).run({
            id: this.id,
            lastMonday
        });
    }
    get timezoneOffset() {
        return this._timezoneOffset;
    }
    set timezoneOffset(timezoneOffset) {
        this._timezoneOffset = timezoneOffset;
        db.prepare(upsert("TimezoneOffset", "timezoneOffset")).run({
            id: this.id,
            timezoneOffset
        });
    }
    get daylightSavingsRegion() {
        return this._daylightSavingsRegion;
    }
    set daylightSavingsRegion(daylightSavingsRegion) {
        this._daylightSavingsRegion = daylightSavingsRegion;
        let dstInfo = 0;

        switch (daylightSavingsRegion) {
            case "na":
                dstInfo = 1;
                break;
            case "eu":
                dstInfo = 2;
                break;
            case "sh":
                dstInfo = 3;
                break;
        }

        db.prepare(upsert("DaylightSavingsRegion", "dstInfo")).run({
            id: this.id,
            dstInfo
        });
    }
    get ecoBetInsurance() {
        return this._ecoBetInsurance;
    }
    set ecoBetInsurance(ecoBetInsurance) {
        this._ecoBetInsurance = ecoBetInsurance;
        db.prepare(upsert("EcoBetInsurance", "ecoBetInsurance")).run({
            id: this.id,
            ecoBetInsurance
        });
    }
    get todoList() {
        return this._todoList;
    }

    getTodoEntry(id: number) {
        return this._todoList.get(id);
    }
    getTodoEntries() {
        return this._todoList.entries();
    }
    hasTodoEntry(id: number) {
        return this._todoList.has(id);
    }
    addTodoEntry(entry: string) {
        const lastModified = Date.now();
        db.prepare("INSERT INTO TodoLists (UserID, Entry, LastModified) VALUES (?, ?, ?)").run(
            this.id,
            entry,
            lastModified
        );
        const {ID} = db
            .prepare("SELECT ID FROM TodoLists WHERE UserID = ? AND Entry = ? AND LastModified = ?")
            .get(this.id, entry, lastModified);
        this._todoList.set(ID, {
            entry,
            lastModified: new Date(lastModified)
        });
    }
    setTodoEntry(id: number, entry: string): boolean {
        const lastModified = Date.now();
        const exists = !!db.prepare("SELECT * FROM TodoLists WHERE UserID = ? AND ID = ?").get(this.id, id);

        if (exists) {
            db.prepare("INSERT INTO TodoLists VALUES (?, ?, ?, ?)").run(id, this.id, entry, lastModified);
            this._todoList.set(id, {
                entry,
                lastModified: new Date(lastModified)
            });
            return true;
        } else {
            return false;
        }
    }
    removeTodoEntry(id: number) {
        db.prepare("DELETE FROM TodoLists WHERE UserID = ? AND ID = ?").run(this.id, id);
        return this._todoList.delete(id);
    }
    clearTodoEntries() {
        db.prepare("DELETE FROM TodoLists WHERE UserID = ?").run(this.id);
        this._todoList.clear();
    }
}
