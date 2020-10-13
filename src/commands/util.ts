import { MessageEmbed } from "discord.js";
import Command from '../core/command';
import {CommonLibrary} from '../core/lib';

export default new Command({
	description: "",
	endpoint: false,
	usage: '',
	async run($: CommonLibrary): Promise<any> {
		
	},
	subcommands: {
		lsemotes: new Command({
			description: "Lists all emotes the bot has in it's registry,",
			endpoint: true,
			async run($: CommonLibrary): Promise<any> {
				const nsfw: string | string[] = [];
				const pages = $.client.emojis.cache.filter(x => !nsfw.includes(x.guild.id), this).array();
				// $.log(pages);
				var embed = new MessageEmbed()
					.setTitle("**Emoji list!**")
					.setColor("AQUA");
				const msg = await $.channel.send({embed});

				$.paginate(msg, $.author.id, pages.length, page => {
					embed.setDescription(`${pages[page]} | ${pages[page].name}`);
					msg.edit(embed);
				});
			}
		}),
		emote: new Command({
			description: "Send the specified emote.",
			run: "Please provide a command name.",
			any: new Command({
				description: "The emote to send.",
				usage: "<emote>",
				async run($: CommonLibrary): Promise<any>
				{
					const search = $.args[0].toLowerCase();
					const emote = $.client.emojis.cache.find(emote => emote.name.toLowerCase().includes(search));
					if (!emote) return $.channel.send("That's not a valid emote name!");
					$.message.delete();
					$.channel.send(`${emote}`);
				}
			})
		})
	}
});