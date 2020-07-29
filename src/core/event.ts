import {Client} from "discord.js";
import Storage from "./storage";
import $ from "./lib";

// Last Updated: Discord.js v12.2.0
const EVENTS = ["channelCreate", "channelDelete", "channelPinsUpdate", "channelUpdate", "debug", "warn", "disconnect", "emojiCreate", "emojiDelete", "emojiUpdate", "error", "guildBanAdd", "guildBanRemove", "guildCreate", "guildDelete", "guildUnavailable", "guildIntegrationsUpdate", "guildMemberAdd", "guildMemberAvailable", "guildMemberRemove", "guildMembersChunk", "guildMemberSpeaking", "guildMemberUpdate", "guildUpdate", "inviteCreate", "inviteDelete", "message", "messageDelete", "messageReactionRemoveAll", "messageReactionRemoveEmoji", "messageDeleteBulk", "messageReactionAdd", "messageReactionRemove", "messageUpdate", "presenceUpdate", "rateLimit", "ready", "invalidated", "roleCreate", "roleDelete", "roleUpdate", "typingStart", "userUpdate", "voiceStateUpdate", "webhookUpdate", "shardDisconnect", "shardError", "shardReady", "shardReconnecting", "shardResume"];

interface EventOptions
{
	readonly on?: Function;
	readonly once?: Function;
}

export default class Event
{
	private readonly on: Function|null;
	private readonly once: Function|null;
	
	constructor(options: EventOptions)
	{
		this.on = options.on || null;
		this.once = options.once || null;
	}
	
	// For this function, I'm going to assume that the event is used with the correct arguments and that the event tag is checked in "storage.ts".
	public attach(client: Client, event: string)
	{
		if(this.on)
			client.on(event as any, this.on as any);
		if(this.once)
			client.once(event as any, this.once as any);
	}
}

export async function loadEvents(client: Client)
{
	for(const file of Storage.open("dist/events", (filename: string) => filename.endsWith(".js")))
	{
		const header = file.substring(0, file.indexOf(".js"));
		const event = (await import(`../events/${header}`)).default;
		
		if(EVENTS.includes(header))
		{
			event.attach(client, header);
			$.log(`Loading Event: ${header}`);
		}
		else
			$.warn(`"${header}" is not a valid event type! Did you misspell it? (Note: If you fixed the issue, delete "dist" because the compiler won't automatically delete any extra files.)`);
	}
}