import { MessageEmbed } from "discord.js";
import Command from "../core/command";
import {CommonLibrary} from "../core/lib";

const responses = [
	"Most likely,",
	"It is certain,",
	"It is decidedly so,",
	"Without a doubt,",
	"Definitely,",
	"You may rely on it,",
	"As I see it, yes,",
	"Outlook good,",
	"Yes,",
	"Signs point to yes,",
	"Reply hazy, try again,",
	"Ask again later,",
	"Better not tell you now,",
	"Cannot predict now,",
	"Concentrate and ask again,",
	"Don't count on it,",
	"My reply is no,",
	"My sources say no,",
	"Outlook not so good,",
	"Very doubtful,"
];

export default new Command({
	description: "Fun commands.",
	endpoint: false,
	run: "Please provide an argument.\nFor help, run `.help fun`.",
	subcommands:
	{
		"8ball": new Command({
			description: "Answers your question in an 8-ball manner.",
			endpoint: false,
			usage: "<question>",
			run: "Please provide a question.",
			any: new Command({
				description: "Question to ask the 8 Ball.",
				async run($: CommonLibrary): Promise<any>
				{
					const sender = $.message.author;
					$.channel.send(responses[Math.floor(Math.random() * responses.length)] + ` <@${sender.id}>`);
				}
			})
		}),
		poll: new Command({
			description: "Create a poll.",
			usage: "<question>",
			run: "Please provide a question.",
			any: new Command({
				description: "Question for the poll.",
				async run($: CommonLibrary): Promise<any>
				{
					const embed = new MessageEmbed()
						.setAuthor(`Poll created by ${$.message.author.username}`, $.message.guild?.iconURL({ dynamic: true }) ?? undefined)
						.setColor(0xffffff)
						.setFooter("React to vote.")
						.setDescription($.args.join(" "));
					const msg = await $.channel.send(embed);
					await msg.react("✅");
					await msg.react("⛔");
					$.message.delete({
						timeout: 1000
					});
				}
			})
		})
	}
});