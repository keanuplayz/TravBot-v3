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
    get webhooks() {
        return this._webhooks;
    }
    // getWebhook, setWebhook, removeWebhook, hasWebhook, getWebhookEntries
    setWebhook(id: string, token: string) {
        this._webhooks.set(id, token);
        db.prepare(
            "INSERT INTO Webhooks VALUES (:id, :token) ON CONFLICT (ID) DO UPDATE SET Token = :token WHERE ID = :id"
        ).run({id, token});
    }
}

// There'll only be one instance of the config.
export const config = new Config();
