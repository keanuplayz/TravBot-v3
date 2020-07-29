import Command from "../core/command";
import {CommonLibrary, logs} from "../core/lib";
import {Config, Storage} from "../core/structures";
import {PermissionNames, getPermissionLevel} from "../core/permissions";

function getLogBuffer(type: string)
{
	return {files: [{
		attachment: Buffer.alloc(logs[type].length, logs[type]),
		name: `${Date.now()}.${type}.log`
	}]};
}

export default new Command({
	description: "An all-in-one command to do admin stuff. You need to be either an admin of the server or one of the bot's mechanics to use this command.",
	async run($: CommonLibrary): Promise<any>
	{
		if(!$.member)
			return $.channel.send("Couldn't find a member object for you! Did you make sure you used this in a server?");
		const permLevel = getPermissionLevel($.member);
		$.channel.send(`${$.author.toString()}, your permission level is \`${PermissionNames[permLevel]}\` (${permLevel}).`);
	},
	subcommands:
	{
		set: new Command({
			description: "Set different per-guild settings for the bot.",
			run: "You have to specify the option you want to set.",
			permission: Command.PERMISSIONS.ADMIN,
			subcommands:
			{
				prefix: new Command({
					description: "Set a custom prefix for your guild. Removes your custom prefix if none is provided.",
					usage: "(<prefix>)",
					async run($: CommonLibrary): Promise<any>
					{
						Storage.getGuild($.guild?.id || "N/A").prefix = null;
						Storage.save();
						$.channel.send(`The custom prefix for this guild has been removed. My prefix is now back to \`${Config.prefix}\`.`);
					},
					any: new Command({
						async run($: CommonLibrary): Promise<any>
						{
							Storage.getGuild($.guild?.id || "N/A").prefix = $.args[0];
							Storage.save();
							$.channel.send(`The custom prefix for this guild is now \`${$.args[0]}\`.`);
						}
					})
				})
			}
		}),
		diag: new Command({
			description: "Requests a debug log with the \"info\" verbosity level.",
			permission: Command.PERMISSIONS.BOT_SUPPORT,
			async run($: CommonLibrary): Promise<any>
			{
				$.channel.send(getLogBuffer("info"));
			},
			any: new Command({
				description: `Select a verbosity to listen to. Available levels: \`[${Object.keys(logs)}]\``,
				async run($: CommonLibrary): Promise<any>
				{
					const type = $.args[0];
					
					if(type in logs)
						$.channel.send(getLogBuffer(type));
					else
						$.channel.send(`Couldn't find a verbosity level named \`${type}\`! The available types are \`[${Object.keys(logs)}]\`.`);
				}
			})
		})
	}
});