import {Webhook, TextChannel, NewsChannel, Permissions, Collection} from "discord.js";
import {client} from "..";
import {Config} from "../structures";

export const webhookStorage = new Collection<string, Webhook>(); // Channel ID: Webhook
const WEBHOOK_PATTERN = /https:\/\/discord\.com\/api\/webhooks\/(\d{17,})\/(.+)/;
const ID_PATTERN = /(\d{17,})/;

// Resolve any available webhooks available for a selected channel.
export async function resolveWebhook(channel: TextChannel | NewsChannel): Promise<Webhook | null> {
    if (channel.guild.me?.permissions.has(Permissions.FLAGS.MANAGE_WEBHOOKS)) {
        const webhooksInChannel = await channel.fetchWebhooks();

        if (webhooksInChannel.size > 0) return webhooksInChannel.first()!;
        else return null;
    }

    for (const [channelID, webhook] of webhookStorage.entries()) if (channel.id === channelID) return webhook;

    return null;
}

export function registerWebhook(url: string): boolean {
    if (WEBHOOK_PATTERN.test(url)) {
        const [_, id, token] = WEBHOOK_PATTERN.exec(url)!;
        Config.webhooks[id] = token;
        Config.save();
        refreshWebhookCache();
        return true;
    } else {
        return false;
    }
}

export function deleteWebhook(urlOrID: string): boolean {
    let id: string | null = null;

    if (WEBHOOK_PATTERN.test(urlOrID)) id = WEBHOOK_PATTERN.exec(urlOrID)![1];
    else if (ID_PATTERN.test(urlOrID)) id = ID_PATTERN.exec(urlOrID)![1];

    if (id) {
        delete Config.webhooks[id];
        Config.save();
        refreshWebhookCache();
    }

    return !!id;
}

// This will return the target channel of a webhook create/edit/delete event.
// No permission is needed to receive this event, but since you only get the target channel, all stored webhooks must be fetched again.
// You can't rely on guilds giving the bot the manage webhooks permission.
client.on("webhookUpdate", refreshWebhookCache);
client.on("ready", refreshWebhookCache);

// Reload webhook objects from the storage.
export async function refreshWebhookCache(): Promise<void> {
    webhookStorage.clear();

    for (const [id, token] of Object.entries(Config.webhooks)) {
        // If there are stored webhook IDs/tokens that don't work, delete those webhooks from storage.
        try {
            const webhook = await client.fetchWebhook(id, token);
            webhookStorage.set(webhook.channelId, webhook);
        } catch {
            delete Config.webhooks[id];
            Config.save();
        }
    }
}
