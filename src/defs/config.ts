import {db} from "../modules/database";
import {Collection} from "discord.js";

class Config {
    private _systemLogsChannel: string | null;
    private _webhooks: Collection<string, string>; // id-token pairs

    constructor() {
        const {SystemLogsChannel} = db.prepare("SELECT * FROM Settings WHERE Tag = 'Main'").get();
        const webhooks = db.prepare("SELECT * FROM Webhooks").all();
        this._systemLogsChannel = SystemLogsChannel;
        this._webhooks = new Collection();

        for (const {ID, Token} of webhooks) {
            this._webhooks.set(ID, Token);
        }
    }

    get systemLogsChannel() {
        return this._systemLogsChannel;
    }
    set systemLogsChannel(systemLogsChannel) {
        this._systemLogsChannel = systemLogsChannel;
        db.prepare("UPDATE Settings SET SystemLogsChannel = ? WHERE Tag = 'Main'").run(systemLogsChannel);
    }

    getWebhook(id: string) {
        return this._webhooks.get(id);
    }
    getWebhookEntries() {
        return this._webhooks.entries();
    }
    hasWebhook(id: string) {
        return this._webhooks.has(id);
    }
    setWebhook(id: string, token: string) {
        db.prepare("INSERT INTO Webhooks VALUES (?, ?)").run(id, token);
        this._webhooks.set(id, token);
    }
    removeWebhook(id: string) {
        db.prepare("DELETE FROM Webhooks WHERE ID = ?").run(id);
        return this._webhooks.delete(id);
    }
}

// There'll only be one instance of the config.
export const config = new Config();
