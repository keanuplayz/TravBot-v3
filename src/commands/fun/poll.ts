import {MessageEmbed, Message, User, MessageActionRow, MessageButton} from "discord.js";
import {NamedCommand, RestCommand, poll, CHANNEL_TYPE, SendFunction, Command} from "onion-lasers";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {pluralise, parseDuration} from "../../lib";

export const header = new SlashCommandBuilder()
    .setDescription("Create a poll.")
    .addStringOption((option) => option.setName("question").setDescription("Question for the poll").setRequired(true))
    .addIntegerOption((option) =>
        option.setName("duration").setDescription("Duration of the poll in seconds.").setRequired(false)
    );

export async function handler(interaction: CommandInteraction) {
    const {options} = interaction;
    const question = options.getString("question", true);
    var duration = options.getInteger("duration", false);
    duration = parseDuration(duration + "s"); //override the duration variable with miliseconds one
    execSlashPoll(interaction, question, duration || 60000);
}

export default new NamedCommand({
    description: "Create a poll.",
    usage: "(<seconds>) <question>",
    run: "Please provide a question.",
    channelType: CHANNEL_TYPE.GUILD,
    number: new Command({
        run: "Please provide a question in addition to the provided duration.",
        any: new RestCommand({
            description: "Question for the poll.",
            async run({send, message, author, args, combined}) {
                execPoll(send, message, author, combined, args[0] * 1000);
            }
        })
    }),
    any: new RestCommand({
        description: "Question for the poll.",
        async run({send, message, author, combined}) {
            execPoll(send, message, author, combined);
        }
    })
});

const AGREE = "✅";
const DISAGREE = "⛔";

async function execSlashPoll(interaction: CommandInteraction, question: string, duration = 60000) {
    const responseButtons = new MessageActionRow().addComponents(
        new MessageButton().setCustomId("agree").setLabel(AGREE).setStyle("SUCCESS"),
        new MessageButton().setCustomId("disagree").setLabel(DISAGREE).setStyle("DANGER")
    );

    const icon =
        interaction.user.avatarURL({
            dynamic: true,
            size: 2048
        }) || interaction.user.defaultAvatarURL;
    const embed = new MessageEmbed()
        .setAuthor(`Poll created by ${interaction.user.username}`, icon)
        .setColor(0xffffff)
        .setFooter("Click the buttons to vote.")
        .setDescription(question)
        .addField(`${AGREE} －`, `${pluralise(0, "", "people have voted")}\n`)
        .addField(`${DISAGREE} －`, `${pluralise(0, "", "people have voted")}\n`);
    const msg = await interaction.reply({
        embeds: [embed],
        components: [responseButtons]
    });
    var idsArray: string[] = [];
    const collector = interaction.channel?.createMessageComponentCollector({time: duration});
    collector?.on("collect", async (i) => {
        if (i.customId === "agree") {
            if (idsArray.includes(i.user.id)) {
                i.reply({content: "You have already voted!", ephemeral: true});
            } else {
                idsArray.push(i.user.id);
                var agree = +1;
                embed.fields[0].value = `${pluralise(agree, "", "people who agree", "person who agrees")}\n`;
                interaction.editReply({embeds: [embed]});
                i.reply({content: "You picked ✅!", ephemeral: true});
            }
        }
        if (i.customId === "disagree") {
            if (idsArray.includes(i.user.id)) {
                i.reply({content: "You have already voted!", ephemeral: true});
            } else {
                idsArray.push(i.user.id);
                var disagree = +1;
                embed.fields[1].value = `${pluralise(disagree, "", "people who disagree", "person who disagrees")}\n`;
                interaction.editReply({embeds: [embed]});
                i.reply({content: "You picked ⛔!", ephemeral: true});
            }
        }
    });
    //This solution looks messy but works really well and stops from stuff like vote fraud happening.
    //I'm not sure if it's the best solution but if you have a better idea then please let me know.

    collector?.on("end", async (collected) => {
        embed.setTitle(`The results of ${interaction.user.username}'s poll:`);
        interaction.editReply({embeds: [embed]});
    });
}

async function execPoll(send: SendFunction, message: Message, user: User, question: string, duration = 60000) {
    const icon =
        user.avatarURL({
            dynamic: true,
            size: 2048
        }) || user.defaultAvatarURL;
    const msg = await send({
        embeds: [
            new MessageEmbed()
                .setAuthor(`Poll created by ${message.author.username}`, icon)
                .setColor(0xffffff)
                .setFooter("React to vote.")
                .setDescription(question)
        ]
    });
    const results = await poll(msg, [AGREE, DISAGREE], duration);
    send({
        embeds: [
            new MessageEmbed()
                .setAuthor(`The results of ${message.author.username}'s poll:`, icon)
                .setTitle(question)
                .setDescription(
                    `${AGREE} － ${pluralise(
                        results[AGREE],
                        "",
                        "people who agree",
                        "person who agrees"
                    )}\n${DISAGREE} － ${pluralise(
                        results[DISAGREE],
                        "",
                        "people who disagree",
                        "person who disagrees"
                    )}`
                )
        ]
    });
    msg.delete();
}
