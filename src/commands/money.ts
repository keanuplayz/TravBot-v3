import Command from "../core/command";
import $, {CommonLibrary} from "../core/lib";
import {Storage} from "../core/structures";
import {User} from "discord.js";

export function getMoneyEmbed(user: User): object
{
	const profile = Storage.getUser(user.id);
	
	return {embed: {
		color: 0xFFFF00,
		author:
		{
			name: user.username,
			icon_url: user.displayAvatarURL({
				format: "png",
				dynamic: true
			})
		},
		fields:
		[
			{
				name: "Balance",
				value: $(profile.money).pluralise("credit", "s")
			}
		]
	}};
}

function getSendEmbed(sender: User, receiver: User, amount: number): object
{
	return {embed: {
		color: 0xFFFF00,
		author:
		{
			name: sender.username,
			icon_url: sender.displayAvatarURL({
				format: "png",
				dynamic: true
			})
		},
		title: "Transaction",
		description: `${sender.toString()} has sent ${$(amount).pluralise("credit", "s")} to ${receiver.toString()}!`,
		fields:
		[
			{
				name: `Sender: ${sender.username}#${sender.discriminator}`,
				value: $(Storage.getUser(sender.id).money).pluralise("credit", "s")
			},
			{
				name: `Receiver: ${receiver.username}#${receiver.discriminator}`,
				value: $(Storage.getUser(receiver.id).money).pluralise("credit", "s")
			}
		],
		footer:
		{
			text: receiver.username,
			icon_url: receiver.displayAvatarURL({
				format: "png",
				dynamic: true
			})
		}
	}};
}

export default new Command({
	description: "See how much money you have. Also provides other commands related to money.",
	async run($: CommonLibrary): Promise<any>
	{
		$.channel.send(getMoneyEmbed($.author));
	},
	subcommands:
	{
		get: new Command({
			description: "Pick up your daily credits. The cooldown is per user and every 22 hours to allow for some leeway.",
			async run($: CommonLibrary): Promise<any>
			{
				const user = Storage.getUser($.author.id);
				const now = Date.now();
				
				if(user.lastReceived === -1)
				{
					user.money = 100;
					user.lastReceived = now;
					Storage.save();
					$.channel.send("Here's 100 credits to get started, the price of a sandwich in Rookie Harbor.", getMoneyEmbed($.author));
				}
				else if(now - user.lastReceived >= 79200000)
				{
					user.money += 25;
					user.lastReceived = now;
					Storage.save();
					$.channel.send("Here's your daily 25 credits.", getMoneyEmbed($.author));
				}
				else
					$.channel.send(`It's too soon to pick up your daily credits. You have about ${((user.lastReceived + 79200000 - now) / 3600000).toFixed(1)} hours to go.`);
			}
		}),
		send: new Command({
			description: "Send money to someone.",
			usage: "<user> <amount>",
			run: "Who are you sending this money to?",
			user: new Command({
				run: "You need to enter an amount you're sending!",
				number: new Command({
					async run($: CommonLibrary): Promise<any>
					{
						const amount = Math.floor($.args[1]);
						const author = $.author;
						const sender = Storage.getUser(author.id);
						const target = $.args[0];
						const receiver = Storage.getUser(target.id);
						
						if(amount <= 0)
							return $.channel.send("You must send at least one credit!");
						else if(sender.money < amount)
							return $.channel.send("You don't have enough money to do that!", getMoneyEmbed(author));
						else if(target.id === author.id)
							return $.channel.send("You can't send money to yourself!");
						else if(target.bot && process.argv[2] !== "dev")
							return $.channel.send("You can't send money to a bot!");
						
						sender.money -= amount;
						receiver.money += amount;
						Storage.save();
						$.channel.send(getSendEmbed(author, target, amount));
					}
				})
			}),
			number: new Command({
				run: "You must use the format `money send <user> <amount>`!"
			}),
			any: new Command({
				async run($: CommonLibrary): Promise<any>
				{
					const last = $.args.pop();
					
					if(!/\d+/g.test(last) && $.args.length === 0)
						return $.channel.send("You need to enter an amount you're sending!");
					
					const amount = Math.floor(last);
					const author = $.author;
					const sender = Storage.getUser(author.id);
					
					if(amount <= 0)
						return $.channel.send("You must send at least one credit!");
					else if(sender.money < amount)
						return $.channel.send("You don't have enough money to do that!", getMoneyEmbed(author));
					else if(!$.guild)
						return $.channel.send("You have to use this in a server if you want to send money with a username!");
					
					const username = $.args.join(" ");
					const member = (await $.guild.members.fetch({
						query: username,
						limit: 1
					})).first();
					
					if(!member)
						return $.channel.send(`Couldn't find a user by the name of \`${username}\`! If you want to send money to someone in a different server, you have to use their user ID!`);
					else if(member.user.id === author.id)
						return $.channel.send("You can't send money to yourself!");
					else if(member.user.bot && process.argv[2] !== "dev")
						return $.channel.send("You can't send money to a bot!");
					
					const target = member.user;
					
					$.prompt(await $.channel.send(`Are you sure you want to send ${$(amount).pluralise("credit", "s")} to this person?\n*(This message will automatically be deleted after 10 seconds.)*`, {embed: {
						color: "#ffff00",
						author:
						{
							name: `${target.username}#${target.discriminator}`,
							icon_url: target.displayAvatarURL({
								format: "png",
								dynamic: true
							})
						}
					}}), $.author.id, () => {
						const receiver = Storage.getUser(target.id);
						sender.money -= amount;
						receiver.money += amount;
						Storage.save();
						$.channel.send(getSendEmbed(author, target, amount));
					});
				}
			})
		}),
		leaderboard: new Command({
			description: "See the richest players tracked by this bot (across servers).",
			async run($: CommonLibrary): Promise<any>
			{
				const users = Storage.users;
				const ids = Object.keys(users);
				ids.sort((a, b) => users[b].money - users[a].money);
				const fields = [];
				
				for(let i = 0, limit = Math.min(10, ids.length); i < limit; i++)
				{
					const id = ids[i];
					const user = await $.client.users.fetch(id);
					
					fields.push({
						name: `#${i+1}. ${user.username}#${user.discriminator}`,
						value: $(users[id].money).pluralise("credit", "s")
					});
				}
				
				$.channel.send({embed: {
					title: "Top 10 Richest Players",
					color: "#ffff00",
					fields: fields
				}});
			}
		})
	},
	user: new Command({
		description: "See how much money someone else has by using their user ID or pinging them.",
		async run($: CommonLibrary): Promise<any>
		{
			$.channel.send(getMoneyEmbed($.args[0]));
		}
	}),
	any: new Command({
		description: "See how much money someone else has by using their username.",
		async run($: CommonLibrary): Promise<any>
		{
			$.callMemberByUsername($.message, $.args.join(" "), member => {
				$.channel.send(getMoneyEmbed(member.user));
			});
		}
	})
});