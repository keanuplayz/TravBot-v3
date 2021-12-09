import {Command, NamedCommand, RestCommand} from "onion-lasers";
import moment from "moment";
import {User} from "../../lib";
import {MessageEmbed} from "discord.js";

export default new NamedCommand({
    description: "Keep and edit your personal todo list.",
    async run({send, author}) {
        const user = new User(author.id);
        const embed = new MessageEmbed().setTitle(`Todo list for ${author.tag}`).setColor("BLUE");

        for (const [id, {entry, lastModified}] of user.getTodoEntries()) {
            embed.addField(
                `\`${id}\`: ${moment(lastModified).format("LT")} ${moment(lastModified).format("LL")} (${moment(
                    lastModified
                ).fromNow()})`,
                entry
            );
        }

        send({embeds: [embed]});
    },
    subcommands: {
        add: new NamedCommand({
            run: "You need to specify a note to add.",
            any: new RestCommand({
                async run({send, author, combined}) {
                    new User(author.id).addTodoEntry(combined);
                    send(`Successfully added \`${combined}\` to your todo list.`);
                }
            })
        }),
        remove: new NamedCommand({
            run: "You need to specify a note to remove.",
            number: new Command({
                async run({send, author, args}) {
                    const user = new User(author.id);
                    const success = user.removeTodoEntry(args[0]);

                    if (success) {
                        send(`Removed Note \`${args[0]}\` from your todo list.`);
                    } else {
                        send("That item couldn't be found.");
                    }
                }
            })
        }),
        clear: new NamedCommand({
            async run({send, author}) {
                new User(author.id).clearTodoEntries();
                send("Cleared todo list.");
            }
        })
    }
});
