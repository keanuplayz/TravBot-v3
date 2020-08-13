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
				const list = $.client.emojis.cache.filter(x => !nsfw.includes(x.guild.id), this)
					.array();
				let page = 1;
				const epg = 20;
				let content = "";
				const left = "⬅",
					right = "➡";
				var embed = new MessageEmbed()
					.setTitle("**Emoji list!**")
					.setColor("AQUA");
				let owo = list.slice((page - 1) * epg, page * epg);
				owo.forEach(q => (content += q.toString() + " | " + q.name + "\n"));
				embed.setDescription(content);
				const msg = await $.channel.send({
					embed
				});
				if (list.length < epg) return;
				await msg.react("⬅");
				await msg.react("➡");
				const backwardsfilter = (reaction: { emoji: { name: string; }; }, user: { id: any; }) => reaction.emoji.name == left && user.id == $.message.author.id;
				const forwardsfilter = (reaction: { emoji: { name: string; }; }, user: { id: any; }) => reaction.emoji.name == right && user.id == $.message.author.id;
				const backwards = msg.createReactionCollector(backwardsfilter, {
					time: 300000
				});
				const forwards = msg.createReactionCollector(forwardsfilter, {
					time: 300000
				});
				backwards.on("collect", () => {
					if (page < 2) return;
					// @ts-ignore
					msg.reactions.cache.find((uwu: { emoji: { name: string; }; }) => (uwu.emoji.name = "⬅"))
						.users.remove($.message.author)
					page--;
					owo = list.slice((page - 1) * epg, page * epg);
					content = "";
					owo.forEach(q => (content += q.toString() + " | " + q.name + "\n"));
					embed.setDescription(content);
					msg.edit(embed);
				});
				forwards.on("collect", () => {
					if (page > Math.ceil(list.length / epg)) return;
					page++;
					// @ts-ignore
					msg.reactions.cache.find((uwu: { emoji: { name: string; }; }) => uwu.emoji.name == "➡")
						.users.remove($.message.author)
					owo = list.slice((page - 1) * epg, page * epg);
					content = "";
					owo.forEach(q => (content += q.toString() + " | " + q.name + "\n"));
					embed.setDescription(content);
					msg.edit(embed);
				});
			}
		})
	}
});