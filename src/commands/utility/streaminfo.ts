import {NamedCommand, RestCommand} from "onion-lasers";
import {streamList} from "../../modules/streamNotifications";
import {Guild, Member} from "../../lib";

// Alternatively, I could make descriptions last outside of just one stream.
// But then again, users could just copy paste descriptions. :leaSMUG:
// Stream presets (for permanent parts of the description) might come some time in the future.
export default new NamedCommand({
    description: "Modifies the current embed for your stream",
    run: "You need to specify whether to set the description or the image (`desc` and `img` respectively).",
    subcommands: {
        description: new NamedCommand({
            aliases: ["desc"],
            description:
                "Sets the description of your stream. You can embed links by writing `[some name](some link)` or remove it",
            usage: "(<description>)",
            async run({send, author}) {
                const userID = author.id;

                if (streamList.has(userID)) {
                    const stream = streamList.get(userID)!;
                    stream.description = undefined;
                    stream.update();
                    send("Successfully removed the stream description.");
                } else {
                    send("You can only use this command when streaming.");
                }
            },
            any: new RestCommand({
                async run({send, author, member, combined}) {
                    const userID = author.id;

                    if (streamList.has(userID)) {
                        const stream = streamList.get(userID)!;
                        stream.description = combined;
                        stream.update();
                        send({
                            content: "Successfully set the stream description to:",
                            embeds: [
                                {
                                    description: stream.description,
                                    color: member!.displayColor
                                }
                            ]
                        });
                    } else {
                        send("You can only use this command when streaming.");
                    }
                }
            })
        }),
        thumbnail: new NamedCommand({
            aliases: ["img"],
            description: "Sets a thumbnail to display alongside the embed or remove it",
            usage: "(<link>)",
            async run({send, author}) {
                const userID = author.id;

                if (streamList.has(userID)) {
                    const stream = streamList.get(userID)!;
                    stream.thumbnail = undefined;
                    stream.update();
                    send("Successfully removed the stream thumbnail.");
                } else {
                    send("You can only use this command when streaming.");
                }
            },
            any: new RestCommand({
                async run({send, author, member, combined}) {
                    const userID = author.id;

                    if (streamList.has(userID)) {
                        const stream = streamList.get(userID)!;
                        stream.thumbnail = combined;
                        stream.update();
                        send({
                            content: `Successfully set the stream thumbnail to: ${combined}`,
                            embeds: [
                                {
                                    description: stream.description,
                                    thumbnail: {url: combined},
                                    color: member!.displayColor
                                }
                            ]
                        });
                    } else {
                        send("You can only use this command when streaming.");
                    }
                }
            })
        }),
        category: new NamedCommand({
            aliases: ["cat", "group"],
            description:
                "Sets the stream category any future streams will be in (as well as notification roles if set)",
            usage: "(<category>)",
            async run({send, guild, author}) {
                const userID = author.id;
                const memberStorage = new Member(userID, guild!.id);
                memberStorage.streamCategory = null;
                send("Successfully removed the category for all your current and future streams.");

                // Then modify the current category if the user is streaming
                if (streamList.has(userID)) {
                    const stream = streamList.get(userID)!;
                    stream.category = "None";
                    stream.update();
                }
            },
            any: new RestCommand({
                async run({send, guild, author, combined}) {
                    const userID = author.id;
                    const guildStorage = new Guild(guild!.id);
                    const memberStorage = new Member(userID, guild!.id);
                    let found = false;

                    // Check if it's a valid category
                    for (const [roleID, categoryName] of guildStorage.getStreamingRoleEntries()) {
                        if (combined === categoryName) {
                            found = true;
                            memberStorage.streamCategory = roleID;
                            send(
                                `Successfully set the category for your current and future streams to: \`${categoryName}\``
                            );

                            // Then modify the current category if the user is streaming
                            if (streamList.has(userID)) {
                                const stream = streamList.get(userID)!;
                                stream.category = categoryName;
                                stream.update();
                            }
                        }
                    }

                    if (!found) {
                        const categories = [];

                        for (const [_, category] of guildStorage.getStreamingRoleEntries()) {
                            categories.push(category);
                        }

                        send(
                            `No valid category found by \`${combined}\`! The available categories are: \`${categories.join(
                                ", "
                            )}\``
                        );
                    }
                }
            })
        })
    }
});
