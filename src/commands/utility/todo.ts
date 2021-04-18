import {NamedCommand, RestCommand} from "onion-lasers";
import moment from "moment";
import {Storage} from "../../structures";
import {MessageEmbed} from "discord.js";

export default new NamedCommand({
    description: "Keep and edit your personal todo list.",
    async run({send, author}) {
        const user = Storage.getUser(author.id);
        const embed = new MessageEmbed().setTitle(`Todo list for ${author.tag}`).setColor("BLUE");

        for (const timestamp in user.todoList) {
            const date = new Date(Number(timestamp));
            embed.addField(
                `${moment(date).format("LT")} ${moment(date).format("LL")} (${moment(date).fromNow()})`,
                user.todoList[timestamp]
            );
        }

        send(embed);
    },
    subcommands: {
        add: new NamedCommand({
            run: "You need to specify a note to add.",
            any: new RestCommand({
                async run({send, author, combined}) {
                    const user = Storage.getUser(author.id);
                    user.todoList[Date.now().toString()] = combined;
                    Storage.save();
                    send(`Successfully added \`${combined}\` to your todo list.`);
                }
            })
        }),
        remove: new NamedCommand({
            run: "You need to specify a note to remove.",
            any: new RestCommand({
                async run({send, author, combined}) {
                    const user = Storage.getUser(author.id);
                    let isFound = false;

                    for (const timestamp in user.todoList) {
                        const selectedNote = user.todoList[timestamp];

                        if (selectedNote === combined) {
                            delete user.todoList[timestamp];
                            Storage.save();
                            isFound = true;
                            send(`Removed \`${combined}\` from your todo list.`);
                        }
                    }

                    if (!isFound) send("That item couldn't be found.");
                }
            })
        }),
        clear: new NamedCommand({
            async run({send, author}) {
                const user = Storage.getUser(author.id);
                user.todoList = {};
                Storage.save();
                send("Cleared todo list.");
            }
        })
    }
});
